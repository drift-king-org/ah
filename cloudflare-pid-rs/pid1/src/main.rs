use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::process;
use std::time::{SystemTime, UNIX_EPOCH};

use nix::errno::Errno;
use nix::sys::signal::{sigaction, SaFlags, SigAction, SigHandler, SigSet, Signal};
use nix::sys::wait::{waitpid, WaitPidFlag, WaitStatus};
use nix::unistd::Pid;

extern "C" fn ignore(_: libc::c_int) {}

fn install_handlers() {
    let action = SigAction::new(SigHandler::Handler(ignore), SaFlags::empty(), SigSet::empty());
    for signal in [Signal::SIGTERM, Signal::SIGCHLD] {
        if let Err(e) = unsafe { sigaction(signal, &action) } {
            eprintln!("pid1: failed to install {signal:?} handler: {e}");
            process::exit(1);
        }
    }
}

fn block_signals() -> SigSet {
    let mut set = SigSet::empty();
    set.add(Signal::SIGTERM);
    set.add(Signal::SIGCHLD);
    set.thread_block().expect("pid1: failed to block signals");
    set
}

fn reap_children() {
    loop {
        match waitpid(Pid::from_raw(-1), Some(WaitPidFlag::WNOHANG)) {
            Ok(WaitStatus::StillAlive) | Err(_) => break,
            Ok(_) => continue,
        }
    }
}

fn env_or_empty(key: &str) -> String {
    std::env::var(key).unwrap_or_default()
}

fn handle(mut stream: TcpStream, started: u64) {
    let mut buf = [0u8; 4096];
    let mut request = Vec::new();
    while let Ok(n) = stream.read(&mut buf) {
        if n == 0 {
            break;
        }
        request.extend_from_slice(&buf[..n]);
        if request.windows(4).any(|w| w == b"\r\n\r\n") {
            break;
        }
    }
    let body = format!(
        "{{\"pid\": {}, \"started\": \"{}\", \"location\": \"{}\", \"durable_object\": \"{}\"}}",
        process::id(),
        started,
        env_or_empty("CLOUDFLARE_LOCATION"),
        env_or_empty("CLOUDFLARE_DURABLE_OBJECT_ID"),
    );
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
        body.len(),
        body
    );
    let _ = stream.write_all(response.as_bytes());
}

fn main() {
    install_handlers();
    let signals = block_signals();

    let started = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("pid1: clock before epoch")
        .as_secs();

    std::thread::spawn(move || {
        let listener = TcpListener::bind("0.0.0.0:8080").expect("pid1: failed to bind :8080");
        for stream in listener.incoming().flatten() {
            handle(stream, started);
        }
    });

    println!("pid1: started pid={}", process::id());

    loop {
        match signals.wait() {
            Ok(Signal::SIGTERM) => {
                println!("pid1: SIGTERM received, exiting");
                process::exit(0);
            }
            Ok(_) => reap_children(),
            Err(Errno::EINTR) => continue,
            Err(_) => reap_children(),
        }
    }
}
