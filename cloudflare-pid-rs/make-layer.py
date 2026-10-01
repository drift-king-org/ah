#!/usr/bin/env python3
import io
import sys
import tarfile


def main() -> int:
    binary_path, output_path = sys.argv[1], sys.argv[2]
    with open(binary_path, "rb") as f:
        data = f.read()

    info = tarfile.TarInfo(name="pid1")
    info.size = len(data)
    info.mode = 0o755
    info.uid = 0
    info.gid = 0
    info.uname = ""
    info.gname = ""
    info.mtime = 0

    with tarfile.open(output_path, "w") as tar:
        tar.addfile(info, io.BytesIO(data))

    print(f"wrote {output_path}: {len(data)} bytes at /pid1")
    return 0


sys.exit(main())
