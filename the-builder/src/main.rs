use oxigraph::io::{RdfFormat, RdfParser};
use oxigraph::model::{BlankNode, NamedNode, Term, Variable};
use oxigraph::sparql::{QueryResults, SparqlEvaluator};
use oxigraph::store::Store;
use std::collections::{HashMap, HashSet, VecDeque};
use std::fs::File;
use std::io::{BufReader, Write};
use std::sync::OnceLock;
use std::process::Command;

const OWL_IMPORTS: &str = "http://www.w3.org/2002/07/owl#imports";
const RDFS_IS_DEFINED_BY: &str = "http://www.w3.org/2000/01/rdf-schema#isDefinedBy";
const DCTERMS_IS_PART_OF: &str = "http://purl.org/dc/terms/isPartOf";
const DCTERMS_IDENTIFIER: &str = "http://purl.org/dc/terms/identifier";
const VANN_PREFERRED_NAMESPACE_URI: &str = "http://purl.org/vocab/vann/preferredNamespaceUri";
const VAR_BASE: &str = "base";
const VAR_STEP: &str = "step";

const AH_TTL: &str = "https://drift-king.org/ah.ttl";
const NOT_AH_TTL: &str = "https://drift-king.org/not-ah.ttl";
const PLAN: &str = "https://drift-king.org/ah/the-builder/plan";
const SPARQL11_QUERY: &str = "https://www.w3.org/TR/sparql11-query/";
const EARL_PASSED: &str = "http://www.w3.org/ns/earl#passed";
const EARL_FAILED: &str = "http://www.w3.org/ns/earl#failed";
const EARL_ASSERTION: &str = "http://www.w3.org/ns/earl#Assertion";
const EARL_ASSERTED_BY: &str = "http://www.w3.org/ns/earl#assertedBy";
const EARL_TEST: &str = "http://www.w3.org/ns/earl#test";
const EARL_SUBJECT: &str = "http://www.w3.org/ns/earl#subject";
const EARL_RESULT: &str = "http://www.w3.org/ns/earl#result";
const EARL_TEST_RESULT: &str = "http://www.w3.org/ns/earl#TestResult";
const EARL_OUTCOME: &str = "http://www.w3.org/ns/earl#outcome";
const RDF_TYPE: &str = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const BUILDER: &str = "https://drift-king.org/ah/the-builder";
const DISK_SCAN: &str = "https://drift-king.org/not-ah/the-linter/disk-scan";

const SCAN_STEP: &str = "https://drift-king.org/not-ah/the-linter/scan";
const COMMIT_STEP: &str = "https://drift-king.org/ah/site/read-commit";
const BUILD: &str = "https://drift-king.org/ah/the-builder/build";
const EXTRACT_STRINGS_STEP: &str = "https://drift-king.org/not-ah/the-linter/extract-strings";

const SKOS_IN_SCHEME: &str = "http://www.w3.org/2004/02/skos/core#inScheme";
const DCTERMS_DESCRIPTION: &str = "http://purl.org/dc/terms/description";
const MESSAGES_SCHEME: &str = "https://drift-king.org/the-builder/messages";
const COMMANDS_SCHEME: &str = "https://drift-king.org/the-builder/commands";
const SD_HAS_EXECUTION_COMMAND: &str = "https://w3id.org/okn/o/sd#hasExecutionCommand";
const SHELL_POSIX: &str = "https://drift-king.org/the-builder/shell/posix";
const SHELL_WINDOWS: &str = "https://drift-king.org/the-builder/shell/windows";
const SHELL_COMMAND_OPTION: &str = "-c";
const C_GIT_SHOW: &str = "https://drift-king.org/the-builder/command/git-show";
const C_SHA256SUM: &str = "https://drift-king.org/the-builder/command/sha256sum";
const C_AST_GREP_SCAN: &str = "https://drift-king.org/the-builder/command/ast-grep-scan";
const C_LIST_FILES: &str = "https://drift-king.org/the-builder/command/list-files";
const C_HEAD_COMMIT: &str = "https://drift-king.org/the-builder/command/head-commit";
const EXTRACTED_STRINGS: &str = "https://drift-king.org/not-ah/the-linter/var/extracted-strings";
const CATALOG_ENTRY: &str = "uri";
const CATALOG_NAME: &str = "name";
const CATALOG_URI: &str = "uri";
const XML_BASE: &str = "xml:base";
const EARL_NAMESPACE: &str = "http://www.w3.org/ns/earl#";
const SPARQL_SELECT: &str = "SELECT";
const SPARQL_WHERE: &str = "WHERE";
const PROP_VALUE: &str = "value";
const PROP_LINE: &str = "line";
const Q_SUBJECT_RULE: &str = "https://drift-king.org/the-builder/queries/subject-rule.rq";
const M_READ_FAILED: &str = "https://drift-king.org/the-builder/message/read-failed";
const M_CATALOG_UNMAPPED: &str = "https://drift-king.org/the-builder/message/catalog-unmapped";
const M_NO_NAMESPACE: &str = "https://drift-king.org/the-builder/message/no-namespace";
const M_QUERY_UNREADABLE: &str = "https://drift-king.org/the-builder/message/query-unreadable";
const M_NOT_SELECT: &str = "https://drift-king.org/the-builder/message/not-select";
const M_CELL: &str = "https://drift-king.org/the-builder/message/cell";
const M_BAD_QUERY: &str = "https://drift-king.org/the-builder/message/bad-query";
const M_QUERY_FAILED: &str = "https://drift-king.org/the-builder/message/query-failed";
const M_CYCLE: &str = "https://drift-king.org/the-builder/message/cycle";
const M_NO_ASSERTION: &str = "https://drift-king.org/the-builder/message/no-assertion";
const M_NO_QUERY_INPUT: &str = "https://drift-king.org/the-builder/message/no-query-input";
const M_NO_SUBJECT_INPUT: &str = "https://drift-king.org/the-builder/message/no-subject-input";
const M_OPEN_GAP: &str = "https://drift-king.org/the-builder/message/open-gap";
const M_CHECK_FAILED: &str = "https://drift-king.org/the-builder/message/check-failed";
const M_AS_EXPECTED: &str = "https://drift-king.org/the-builder/message/as-expected";
const M_FINDING: &str = "https://drift-king.org/the-builder/message/finding";
const M_COMMAND_FAILED: &str = "https://drift-king.org/the-builder/message/command-failed";
const M_GIT_SHOW_FAILED: &str = "https://drift-king.org/the-builder/message/git-show-failed";
const M_HASH_MISMATCH: &str = "https://drift-king.org/the-builder/message/hash-mismatch";
const M_PUBLISHED: &str = "https://drift-king.org/the-builder/message/published";
const M_UNKNOWN_ROLE: &str = "https://drift-king.org/the-builder/message/unknown-role";
const M_NO_TEMPLATE: &str = "https://drift-king.org/the-builder/message/no-template";
const M_NO_TARGET: &str = "https://drift-king.org/the-builder/message/no-target";
const M_COMPILE_FAILED: &str = "https://drift-king.org/the-builder/message/compile-failed";
const M_RENDER_FAILED: &str = "https://drift-king.org/the-builder/message/render-failed";
const M_RENDERED_MATCHES: &str = "https://drift-king.org/the-builder/message/rendered-matches";
const M_RENDERED: &str = "https://drift-king.org/the-builder/message/rendered";
const M_CATALOG_REQUIRED: &str = "https://drift-king.org/the-builder/message/catalog-required";
const M_DRY_RUN_STEP: &str = "https://drift-king.org/the-builder/message/dry-run-step";
const M_SKIPPED: &str = "https://drift-king.org/the-builder/message/skipped";
const M_HELD: &str = "https://drift-king.org/the-builder/message/held";
const M_UNTAKEN: &str = "https://drift-king.org/the-builder/message/untaken";
const M_NOT_SHIPPED: &str = "https://drift-king.org/the-builder/message/not-shipped";
const M_PROCEEDING: &str = "https://drift-king.org/the-builder/message/proceeding";
const M_CHECKS_FAILED: &str = "https://drift-king.org/the-builder/message/checks-failed";

const Q_PLAN_STEPS: &str = "https://drift-king.org/the-builder/queries/plan-steps.rq";
const Q_STEP_PRECEDES: &str = "https://drift-king.org/the-builder/queries/step-precedes.rq";
const Q_STEP_INPUT_ENTITIES: &str = "https://drift-king.org/the-builder/queries/step-input-entities.rq";
const Q_EXPECTED_OUTCOME: &str = "https://drift-king.org/the-builder/queries/expected-outcome.rq";
const Q_KNOWN_GAP: &str = "https://drift-king.org/the-builder/queries/known-gap.rq";
const Q_UNTAKEN: &str = "https://drift-king.org/the-builder/queries/untaken.rq";
const Q_PUBLISH_COPIES: &str = "https://drift-king.org/the-builder/queries/publish-copies.rq";
const Q_CODE_SCOPE: &str = "https://drift-king.org/the-builder/queries/code-scope.rq";
const Q_RENDER_INPUTS: &str = "https://drift-king.org/the-builder/queries/render-inputs.rq";
const ROLE_MUSTACHE: &str = "https://mustache.github.io/mustache.5.html";
const ROLE_COMMONMARK: &str = "https://spec.commonmark.org/";
const ROLE_YAML: &str = "https://yaml.org/spec/1.2.2/";

/// Every message the-builder prints lives in the model: a skos:Concept in
/// the-builder/messages whose dcterms:description is a Mustache template.
/// The code names a message by its IRI and fills the template's slots; it
/// never spells one. Until the model is loaded (reading the catalog and the
/// model itself) a message prints as its IRI, then its slot values.
static MESSAGES: OnceLock<HashMap<String, String>> = OnceLock::new();
/// The commands the-builder runs itself, the same way: a command's
/// sd:hasExecutionCommand is a Mustache template the code fills.
static COMMANDS: OnceLock<HashMap<String, String>> = OnceLock::new();

/// Each member of `scheme`, with the literal it has for `property`.
fn scheme_templates(store: &Store, scheme: &str, property: &str) -> HashMap<String, String> {
    let in_scheme = NamedNode::new_unchecked(SKOS_IN_SCHEME);
    let scheme = NamedNode::new_unchecked(scheme);
    let property = NamedNode::new_unchecked(property);
    let mut templates = HashMap::new();
    for quad in store.quads_for_pattern(None, Some(in_scheme.as_ref()), Some(scheme.as_ref().into()), None).filter_map(|q| q.ok()) {
        if let oxigraph::model::NamedOrBlankNode::NamedNode(member) = &quad.subject {
            for d in store.quads_for_pattern(Some(member.as_ref().into()), Some(property.as_ref()), None, None).filter_map(|q| q.ok()) {
                if let Term::Literal(template) = d.object {
                    templates.insert(member.as_str().to_string(), template.value().to_string());
                }
            }
        }
    }
    templates
}

fn load_messages(store: &Store) {
    let _ = MESSAGES.set(scheme_templates(store, MESSAGES_SCHEME, DCTERMS_DESCRIPTION));
    let _ = COMMANDS.set(scheme_templates(store, COMMANDS_SCHEME, SD_HAS_EXECUTION_COMMAND));
}

fn fill(template: &str, slots: &[(&str, &str)]) -> Option<String> {
    let data = mustache::Data::Map(
        slots.iter().map(|(k, v)| (k.to_string(), mustache::Data::String(v.to_string()))).collect(),
    );
    mustache::compile_str(template).ok().and_then(|t| t.render_data_to_string(&data).ok())
}

/// A command from the model, filled and run through the shell, its output
/// captured. A command the model does not hold is a failed command.
fn run_named_command(command: &str, slots: &[(&str, &str)]) -> Result<std::process::Output, Box<dyn std::error::Error>> {
    let line = COMMANDS
        .get()
        .and_then(|c| c.get(command))
        .and_then(|t| fill(t, slots))
        .unwrap_or_else(|| die(M_COMMAND_FAILED, &[("command", command)]));
    Ok(shell().args([SHELL_COMMAND_OPTION, line.as_str()]).output()?)
}

/// The shell every command runs in, as the model names it for this system.
fn shell() -> Command {
    let which = if cfg!(windows) { SHELL_WINDOWS } else { SHELL_POSIX };
    let program = COMMANDS.get().and_then(|c| c.get(which)).cloned().unwrap_or_else(|| die(M_COMMAND_FAILED, &[("command", which)]));
    Command::new(program)
}

fn bare(message: &str, slots: &[(&str, &str)]) -> String {
    let mut line = message.to_string();
    for (_, value) in slots {
        line.push(' ');
        line.push_str(value);
    }
    line
}

fn say(message: &str, slots: &[(&str, &str)]) -> String {
    MESSAGES
        .get()
        .and_then(|m| m.get(message))
        .and_then(|t| fill(t, slots))
        .unwrap_or_else(|| bare(message, slots))
}

fn tell(line: &str) {
    let mut out = std::io::stdout();
    let _ = out.write_all(line.as_bytes());
    let _ = out.write_all(&[b'\n']);
}

fn complain(line: &str) {
    let mut err = std::io::stderr();
    let _ = err.write_all(line.as_bytes());
    let _ = err.write_all(&[b'\n']);
}

fn die(message: &str, slots: &[(&str, &str)]) -> ! {
    complain(&say(message, slots));
    std::process::exit(1)
}

struct Step {
    iri: NamedNode,
    title: Option<String>,
    command: Option<String>,
    copy: bool,
    render: bool,
    ready: bool,
    ship: bool,
}

/// What a check step found: it passed, it failed outright, or it failed
/// against a signed gap. A signed gap excuses the run -- it never excuses a
/// build-like step from shipping the thing the gap is about.
enum CheckOutcome {
    Passed,
    Failed,
    OpenGap,
}

/// Not a general XML parser -- just enough for catalog-v001.xml's own fixed
/// shape, a flat list of self-closing <uri name="..." uri="..."/> elements.
fn parse_catalog(path: &str) -> HashMap<String, String> {
    let content = std::fs::read_to_string(path)
        .unwrap_or_else(|e| die(M_READ_FAILED, &[("path", path), ("e", &e.to_string())]));
    let attr = |entry: &str, name: &str| -> Option<String> {
        let mut needle = name.to_string();
        needle.push('=');
        needle.push('"');
        let start = entry.find(&needle)? + needle.len();
        let end = entry[start..].find('"')? + start;
        Some(entry[start..end].to_string())
    };
    content
        .split('<')
        .filter_map(|element| {
            let element = element.split('>').next()?;
            if element.split_whitespace().next()? != CATALOG_ENTRY {
                return None;
            }
            Some((attr(element, CATALOG_NAME)?, attr(element, CATALOG_URI)?))
        })
        .collect()
}

fn catalog_path<'a>(catalog: &'a HashMap<String, String>, iri: &str) -> &'a str {
    catalog.get(iri).unwrap_or_else(|| die(M_CATALOG_UNMAPPED, &[("iri", iri)]))
}

fn load_file(store: &Store, path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let parser = RdfParser::from_format(RdfFormat::Turtle).with_base_iri("https://drift-king.org/")?;
    // The vocabulary copies vendored in M1 include RDF/XML files (VANN,
    // EARL, P-Plan); Turtle-only would fail to load them. Try RDF/XML on a
    // Turtle parse failure rather than sniffing the extension.
    match store.load_from_reader(parser, reader) {
        Ok(()) => Ok(()),
        Err(_) => {
            let mut bytes = std::fs::read(path)?;
            // the-builder/vocab/earl.rdf declares xml:base="" at its root.
            // oxigraph's RDF/XML reader takes that literally rather than
            // resolving it against the parser's own base first, so every
            // rdf:about="" or "#Fragment" in the file fails to parse with no
            // base at all. Patched only in the bytes handed to the parser --
            // the vendored file on disk, and its sha256, are untouched.
            let mut broken = XML_BASE.to_string();
            broken.push('=');
            broken.push('"');
            let mut fixed = broken.clone();
            broken.push('"');
            fixed.push_str(EARL_NAMESPACE);
            fixed.push('"');
            let broken_base: &[u8] = broken.as_bytes();
            let fixed_base: &[u8] = fixed.as_bytes();
            if let Some(pos) = bytes.windows(broken_base.len()).position(|w| w == broken_base) {
                bytes.splice(pos..pos + broken_base.len(), fixed_base.iter().copied());
            }
            let parser = RdfParser::from_format(RdfFormat::RdfXml).with_base_iri("https://drift-king.org/")?;
            store.load_from_reader(parser, bytes.as_slice())?;
            Ok(())
        }
    }
}

fn imports(store: &Store, subject: &NamedNode) -> Vec<NamedNode> {
    let prop = NamedNode::new_unchecked(OWL_IMPORTS);
    store
        .quads_for_pattern(Some(subject.as_ref().into()), Some(prop.as_ref()), None, None)
        .filter_map(|q| q.ok())
        .filter_map(|q| match q.object {
            Term::NamedNode(n) => Some(n),
            _ => None,
        })
        .collect()
}

/// Loads every seed and every owl:imports it reaches, transitively, resolving
/// every name through the catalog -- never a hard-coded path. A name the
/// catalog doesn't map is an error, not a silent skip. `skip` is never
/// loaded, even if reached: how the-builder keeps a vocabulary-only store
/// from ever picking up ah.ttl's or not-ah.ttl's own triples.
fn load_transitively(
    store: &Store,
    catalog: &HashMap<String, String>,
    seeds: Vec<String>,
    skip: &HashSet<String>,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut seen: HashSet<String> = skip.clone();
    let mut queue: VecDeque<String> = VecDeque::new();
    for s in seeds {
        if seen.insert(s.clone()) {
            queue.push_back(s);
        }
    }
    while let Some(iri) = queue.pop_front() {
        load_file(store, catalog_path(catalog, &iri))?;
        let node = NamedNode::new_unchecked(iri.clone());
        for imp in imports(store, &node) {
            let imp_str = imp.into_string();
            if !skip.contains(&imp_str) && seen.insert(imp_str.clone()) {
                queue.push_back(imp_str);
            }
        }
    }
    Ok(())
}

/// Which file defines each of our own terms, as rdfs:isDefinedBy: for every
/// file of ours the model reaches (ah.ttl and what it imports, each named in
/// the catalog under our namespace), every IRI of ours that file uses as a
/// subject is defined by it. Read from each file alone, never guessed from
/// the merged store, so a query can send an address to the file that
/// describes it.
fn record_definitions(store: &Store, catalog: &HashMap<String, String>) -> Result<(), Box<dyn std::error::Error>> {
    let base = term_value(&our_base(store));
    let imports_prop = NamedNode::new_unchecked(OWL_IMPORTS);
    let defined_by = NamedNode::new_unchecked(RDFS_IS_DEFINED_BY);
    let mut files: Vec<&String> = catalog
        .keys()
        .filter(|iri| iri.starts_with(&base))
        .filter(|iri| {
            iri.as_str() == AH_TTL
                || store
                    .quads_for_pattern(None, Some(imports_prop.as_ref()), Some(NamedNode::new_unchecked(iri.as_str()).as_ref().into()), None)
                    .next()
                    .is_some()
        })
        .collect();
    files.sort();
    for file_iri in files {
        let alone = Store::new()?;
        load_file(&alone, catalog_path(catalog, file_iri))?;
        let file = NamedNode::new_unchecked(file_iri.as_str());
        let mut subjects: HashSet<String> = HashSet::new();
        for quad in alone.iter().filter_map(|q| q.ok()) {
            if let oxigraph::model::NamedOrBlankNode::NamedNode(subject) = &quad.subject {
                if subject.as_str().starts_with(&base) {
                    subjects.insert(subject.as_str().to_string());
                }
            }
        }
        for subject in subjects {
            store.insert(oxigraph::model::QuadRef::new(
                &NamedNode::new_unchecked(subject),
                &defined_by,
                &file,
                oxigraph::model::GraphNameRef::DefaultGraph,
            ))?;
        }
    }
    Ok(())
}

/// The vendored vocabularies alone: every owl:imports ah.ttl reaches, except
/// ah.ttl and not-ah.ttl themselves. This is what a canary is evaluated
/// against -- the vocabulary a check's rdfs:domain/range logic needs, never
/// the model, so a canary step can never read a canary and the model
/// together (the-linter/checks/canary-isolation.rq).
fn build_vocab_store(main_store: &Store, catalog: &HashMap<String, String>) -> Result<Store, Box<dyn std::error::Error>> {
    let ah = NamedNode::new_unchecked(AH_TTL);
    let seeds: Vec<String> = imports(main_store, &ah)
        .into_iter()
        .map(NamedNode::into_string)
        .filter(|s| s != NOT_AH_TTL)
        .collect();
    let mut skip = HashSet::new();
    skip.insert(AH_TTL.to_string());
    skip.insert(NOT_AH_TTL.to_string());
    let store = Store::new()?;
    load_transitively(&store, catalog, seeds, &skip)?;
    Ok(store)
}

/// ah.ttl's own vann:preferredNamespaceUri, read from the real model. Not
/// model content a check inspects -- which IRI is "ours" is identity, the
/// same fact AH_TTL already hard-codes -- so a check that needs it (named-by-
/// nobody.rq, code-strings-named.rq) takes it as a bound ?base rather than
/// looking it up itself, and a canary evaluated in isolation still gets it.
fn our_base(store: &Store) -> Term {
    let ah = NamedNode::new_unchecked(AH_TTL);
    let vann_prop = NamedNode::new_unchecked(VANN_PREFERRED_NAMESPACE_URI);
    store
        .quads_for_pattern(Some(ah.as_ref().into()), Some(vann_prop.as_ref()), None, None)
        .filter_map(|q| q.ok())
        .map(|q| q.object)
        .next()
        .unwrap_or_else(|| die(M_NO_NAMESPACE, &[("model", AH_TTL), ("property", VANN_PREFERRED_NAMESPACE_URI)]))
}

/// The variables a query projects, read from its own SELECT clause -- not a
/// SPARQL parse, just enough text handling to know whether ?base is one of
/// them before substituting it (oxigraph errors if a substituted variable
/// isn't projected).
fn select_vars(query_text: &str) -> HashSet<String> {
    let after_select = query_text.split(SPARQL_SELECT).nth(1).unwrap_or_default();
    let header = after_select.split(SPARQL_WHERE).next().unwrap_or_default();
    header
        .split_whitespace()
        .filter_map(|tok| tok.strip_prefix('?'))
        .map(str::to_string)
        .collect()
}

fn read_query(catalog: &HashMap<String, String>, iri: &str) -> String {
    std::fs::read_to_string(catalog_path(catalog, iri))
        .unwrap_or_else(|e| die(M_QUERY_UNREADABLE, &[("iri", iri), ("e", &e.to_string())]))
}

/// Every solution of an already-executed SELECT, as a plain map per row.
fn collect_rows(results: QueryResults, query_iri: &str) -> Vec<HashMap<String, Term>> {
    let QueryResults::Solutions(solutions) = results else {
        die(M_NOT_SELECT, &[("query", query_iri)]);
    };
    solutions
        .filter_map(|s| s.ok())
        .map(|s| {
            let mut row = HashMap::new();
            for v in s.iter() {
                let (var, term) = v;
                row.insert(var.as_str().to_string(), term.clone());
            }
            row
        })
        .collect()
}

/// One row, plainly: every bound variable and its value, ?name=value,
/// ordered by name. What the-builder itself prints as evidence for a
/// check's findings -- never a Rust Debug dump.
fn format_row(row: &HashMap<String, Term>) -> String {
    let mut keys: Vec<&String> = row.keys().collect();
    keys.sort();
    keys.into_iter()
        .map(|k| say(M_CELL, &[("name", k), ("value", &term_string(row, k).unwrap_or_default())]))
        .collect::<Vec<_>>()
        .join(&' '.to_string())
}

/// Runs a named query with the given variable substitutions, returning every
/// solution as a plain map. The one place main.rs turns a query FILE into an
/// executed query -- the query text itself never appears as a literal here.
fn run_named_query(
    store: &Store,
    catalog: &HashMap<String, String>,
    query_iri: &str,
    bindings: &[(&str, Term)],
) -> Vec<HashMap<String, Term>> {
    let text = read_query(catalog, query_iri);
    let mut prepared = SparqlEvaluator::new()
        .parse_query(&text)
        .unwrap_or_else(|e| die(M_BAD_QUERY, &[("query", query_iri), ("e", &e.to_string())]));
    for (name, term) in bindings {
        prepared = prepared.substitute_variable(Variable::new(*name).unwrap(), term.clone());
    }
    let results = prepared.on_store(store).execute().unwrap_or_else(|e| {
        die(M_QUERY_FAILED, &[("query", query_iri), ("e", &e.to_string())])
    });
    collect_rows(results, query_iri)
}

fn term_string(row: &HashMap<String, Term>, key: &str) -> Option<String> {
    row.get(key).map(|t| match t {
        Term::NamedNode(n) => n.as_str().to_string(),
        Term::Literal(l) => l.value().to_string(),
        _ => t.to_string(),
    })
}

fn plan_steps(store: &Store, catalog: &HashMap<String, String>, plan: &str) -> Vec<Step> {
    let rows = run_named_query(store, catalog, Q_PLAN_STEPS, &[
        ("plan", Term::NamedNode(NamedNode::new_unchecked(plan))),
    ]);
    rows.into_iter()
        .map(|row| Step {
            iri: NamedNode::new_unchecked(term_string(&row, "step").unwrap()),
            title: term_string(&row, "title"),
            command: term_string(&row, "command"),
            copy: row.get("copy") == Some(&Term::from(oxigraph::model::Literal::from(true))),
            render: row.get("render") == Some(&Term::from(oxigraph::model::Literal::from(true))),
            ready: row.get("ready") == Some(&Term::from(oxigraph::model::Literal::from(true))),
            ship: row.get("ship") == Some(&Term::from(oxigraph::model::Literal::from(true))),
        })
        .collect()
}

fn step_precedes(store: &Store, catalog: &HashMap<String, String>, plan: &str) -> Vec<(String, String)> {
    let rows = run_named_query(store, catalog, Q_STEP_PRECEDES, &[
        ("plan", Term::NamedNode(NamedNode::new_unchecked(plan))),
    ]);
    rows.into_iter()
        .map(|row| (term_string(&row, "step").unwrap(), term_string(&row, "before").unwrap()))
        .collect()
}

/// Kahn's algorithm: each step after every step it isPrecededBy. Ties broken
/// by IRI, so the order is the same every run.
fn order_steps(steps: &[Step], edges: &[(String, String)]) -> Vec<String> {
    let all: HashSet<String> = steps.iter().map(|s| s.iri.as_str().to_string()).collect();
    let mut deps: HashMap<String, Vec<String>> = HashMap::new();
    for s in &all {
        deps.insert(s.clone(), Vec::new());
    }
    for (step, before) in edges {
        if all.contains(step) && all.contains(before) {
            deps.get_mut(step).unwrap().push(before.clone());
        }
    }
    let mut order: Vec<String> = Vec::new();
    let mut remaining: HashSet<String> = all;
    while !remaining.is_empty() {
        let mut ready: Vec<String> = remaining
            .iter()
            .filter(|s| deps[*s].iter().all(|d| order.contains(d)))
            .cloned()
            .collect();
        if ready.is_empty() {
            die(M_CYCLE, &[]);
        }
        ready.sort();
        let next = ready.into_iter().next().unwrap();
        remaining.remove(&next);
        order.push(next);
    }
    order
}

/// Every step that must run before `step`, transitively -- not just its
/// direct p-plan:isPrecededBy, but theirs too, and so on. Used to decide
/// whether a failed check is upstream of a build step, not just whether
/// any check anywhere failed.
fn ancestors(step: &str, edges: &[(String, String)]) -> HashSet<String> {
    let mut direct: HashMap<&str, Vec<&str>> = HashMap::new();
    for (s, before) in edges {
        direct.entry(s.as_str()).or_default().push(before.as_str());
    }
    let mut seen: HashSet<String> = HashSet::new();
    let mut queue: VecDeque<&str> = VecDeque::new();
    queue.push_back(step);
    while let Some(current) = queue.pop_front() {
        for before in direct.get(current).into_iter().flatten() {
            if seen.insert(before.to_string()) {
                queue.push_back(before);
            }
        }
    }
    seen
}

/// Like `ancestors`, but it does not look past a ready step. A ready step has
/// already stopped the build on any failed check and accepted every signed
/// gap by name, so a gap's hold ends there.
fn ancestors_to_ready(step: &str, edges: &[(String, String)], ready: &HashSet<String>) -> HashSet<String> {
    let mut direct: HashMap<&str, Vec<&str>> = HashMap::new();
    for (s, before) in edges {
        direct.entry(s.as_str()).or_default().push(before.as_str());
    }
    let mut seen: HashSet<String> = HashSet::new();
    let mut queue: VecDeque<&str> = VecDeque::new();
    queue.push_back(step);
    while let Some(current) = queue.pop_front() {
        for before in direct.get(current).into_iter().flatten() {
            if seen.insert(before.to_string()) && !ready.contains(*before) {
                queue.push_back(before);
            }
        }
    }
    seen
}

fn step_input_entities(store: &Store, catalog: &HashMap<String, String>, step: &str) -> Vec<(String, Option<String>)> {
    let rows = run_named_query(store, catalog, Q_STEP_INPUT_ENTITIES, &[
        ("step", Term::NamedNode(NamedNode::new_unchecked(step))),
    ]);
    rows.into_iter()
        .map(|row| (term_string(&row, "entity").unwrap(), term_string(&row, "conformsTo")))
        .collect()
}

fn expected_outcome(store: &Store, catalog: &HashMap<String, String>, test: &str, subject: &str) -> String {
    let rows = run_named_query(store, catalog, Q_EXPECTED_OUTCOME, &[
        ("test", Term::NamedNode(NamedNode::new_unchecked(test))),
        ("subject", Term::NamedNode(NamedNode::new_unchecked(subject))),
    ]);
    rows.first()
        .and_then(|row| term_string(row, "outcome"))
        .unwrap_or_else(|| die(M_NO_ASSERTION, &[("test", test), ("subject", subject)]))
}

/// An approved, open gap for this (test, subject) pair, if the model
/// records one -- something already known to fail, tracked rather than
/// hidden, per prov:wasAttributedTo an approving agent.
fn known_gap(store: &Store, catalog: &HashMap<String, String>, test: &str, subject: &str) -> bool {
    !run_named_query(store, catalog, Q_KNOWN_GAP, &[
        ("test", Term::NamedNode(NamedNode::new_unchecked(test))),
        ("subject", Term::NamedNode(NamedNode::new_unchecked(subject))),
    ])
    .is_empty()
}

/// Loads a query step's subject into `store`: RDF as RDF, a Rust or JS source
/// file the same way extract-strings ingests one, so a canary that is real
/// source code is checked the same way real source code is.
fn load_subject(model: &Store, catalog: &HashMap<String, String>, store: &Store, subject: &str, path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let rows = run_named_query(model, catalog, Q_SUBJECT_RULE, &[
        ("subject", Term::NamedNode(NamedNode::new_unchecked(subject))),
        ("base", our_base(model)),
    ]);
    match rows.first() {
        Some(row) => ingest_source_folder(store, &term_value(&our_base(model)), path, &term_string(row, "rule").unwrap(), &term_string(row, "class").unwrap()),
        None => load_file(store, path),
    }
}

/// Runs one query step: finds its query and its one subject entity, evaluates
/// the query against the right store -- the shared model store if the subject
/// is the-model (already loaded, including anything an earlier command step
/// injected into it), an isolated vocabulary-only store otherwise -- and
/// checks the outcome against what the-model already says to expect. Returns
/// whether the step passed, failed, or failed against a signed gap -- never
/// exits early, so every check step runs and prints, regardless of what an
/// earlier one found.
fn run_query_step(store: &Store, catalog: &HashMap<String, String>, step: &str) -> Result<CheckOutcome, Box<dyn std::error::Error>> {
    let entities = step_input_entities(store, catalog, step);
    let (query_iri, _) = entities
        .iter()
        .find(|(_, conforms)| conforms.as_deref() == Some(SPARQL11_QUERY))
        .unwrap_or_else(|| die(M_NO_QUERY_INPUT, &[("step", step)]));
    let subject_iri = entities
        .iter()
        .map(|(e, _)| e)
        .find(|e| *e != query_iri)
        .unwrap_or_else(|| die(M_NO_SUBJECT_INPUT, &[("step", step)]));

    let query_text = read_query(catalog, query_iri);
    let vars = select_vars(&query_text);
    let bind_base = |mut prepared: oxigraph::sparql::PreparedSparqlQuery| -> oxigraph::sparql::PreparedSparqlQuery {
        if vars.contains(VAR_BASE) {
            prepared = prepared.substitute_variable(Variable::new(VAR_BASE).unwrap(), our_base(store));
        }
        prepared
    };
    let rows = if subject_iri == AH_TTL {
        let prepared = bind_base(SparqlEvaluator::new().parse_query(&query_text)?);
        collect_rows(prepared.on_store(store).execute()?, query_iri)
    } else {
        let isolated = build_vocab_store(store, catalog)?;
        load_subject(store, catalog, &isolated, subject_iri, catalog_path(catalog, subject_iri))?;
        let prepared = bind_base(SparqlEvaluator::new().parse_query(&query_text)?);
        collect_rows(prepared.on_store(&isolated).execute()?, query_iri)
    };
    let found = !rows.is_empty();

    let expected = expected_outcome(store, catalog, query_iri, subject_iri);
    let actual = if found { EARL_FAILED } else { EARL_PASSED };
    record_result(store, query_iri, subject_iri, actual)?;
    if actual != expected {
        if known_gap(store, catalog, query_iri, subject_iri) {
            tell(&say(M_OPEN_GAP, &[("step", step), ("expected", &expected), ("actual", actual), ("query", query_iri), ("subject", subject_iri)]));
            for row in &rows {
                tell(&say(M_FINDING, &[("finding", &format_row(row))]));
            }
            return Ok(CheckOutcome::OpenGap);
        }
        tell(&say(M_CHECK_FAILED, &[("step", step), ("expected", &expected), ("actual", actual), ("query", query_iri), ("subject", subject_iri)]));
        for row in &rows {
            tell(&say(M_FINDING, &[("finding", &format_row(row))]));
        }
        return Ok(CheckOutcome::Failed);
    }
    tell(&say(M_AS_EXPECTED, &[("step", step), ("actual", actual)]));
    if actual == EARL_FAILED {
        for row in &rows {
            tell(&say(M_FINDING, &[("finding", &format_row(row))]));
        }
    }
    Ok(CheckOutcome::Passed)
}

/// What this run found, as the-builder's own EARL assertion: this test, on
/// this subject, had this outcome. Kept in the model for the rest of the run,
/// so a render step that waits for the check can show exactly what it found.
fn record_result(store: &Store, test: &str, subject: &str, outcome: &str) -> Result<(), Box<dyn std::error::Error>> {
    let assertion = BlankNode::default();
    let result = BlankNode::default();
    let quad = |s: &BlankNode, p: &str, o: Term| oxigraph::model::Quad::new(s.clone(), NamedNode::new_unchecked(p), o, oxigraph::model::GraphName::DefaultGraph);
    let iri = |i: &str| Term::NamedNode(NamedNode::new_unchecked(i));
    for q in [
        quad(&assertion, RDF_TYPE, iri(EARL_ASSERTION)),
        quad(&assertion, EARL_ASSERTED_BY, iri(BUILDER)),
        quad(&assertion, EARL_TEST, iri(test)),
        quad(&assertion, EARL_SUBJECT, iri(subject)),
        quad(&assertion, EARL_RESULT, Term::BlankNode(result.clone())),
        quad(&result, RDF_TYPE, iri(EARL_TEST_RESULT)),
        quad(&result, EARL_OUTCOME, iri(outcome)),
    ] {
        store.insert(&q)?;
    }
    Ok(())
}

/// git ls-files -co --exclude-standard, one dcterms:isPartOf/dcterms:identifier
/// observation per real file, fresh every run -- never a kept list. Feeds
/// named-by-nobody.
fn ingest_disk_scan(store: &Store, stdout: &str) -> Result<(), Box<dyn std::error::Error>> {
    let marker = NamedNode::new_unchecked(DISK_SCAN);
    let is_part_of = NamedNode::new_unchecked(DCTERMS_IS_PART_OF);
    let identifier = NamedNode::new_unchecked(DCTERMS_IDENTIFIER);
    for (i, line) in stdout.lines().filter(|l| !l.is_empty()).enumerate() {
        let mut obs = DISK_SCAN.to_string();
        obs.push('/');
        obs.push_str(&i.to_string());
        let obs = NamedNode::new_unchecked(obs);
        store.insert(oxigraph::model::QuadRef::new(&obs, &is_part_of, &marker, oxigraph::model::GraphNameRef::DefaultGraph))?;
        store.insert(oxigraph::model::QuadRef::new(
            &obs,
            &identifier,
            oxigraph::model::LiteralRef::new_simple_literal(line),
            oxigraph::model::GraphNameRef::DefaultGraph,
        ))?;
    }
    Ok(())
}

/// The commit this build is run from, noted on the build: one dcterms:identifier,
/// read fresh every run. Feeds the addresses that name the exact file the site
/// was built from.
fn ingest_head_commit(store: &Store, stdout: &str) -> Result<(), Box<dyn std::error::Error>> {
    let build = NamedNode::new_unchecked(BUILD);
    let identifier = NamedNode::new_unchecked(DCTERMS_IDENTIFIER);
    store.insert(oxigraph::model::QuadRef::new(
        &build,
        &identifier,
        oxigraph::model::LiteralRef::new_simple_literal(stdout.trim()),
        oxigraph::model::GraphNameRef::DefaultGraph,
    ))?;
    Ok(())
}

/// One ast-grep match's quoted pieces, unescaped and concatenated -- a bare
/// literal is one piece; concat! and `+`-joined literals are several,
/// matched as one node by the-linter's own rule (M0), so their pieces must be
/// joined the same way here.
fn joined_value(text: &str) -> String {
    let mut value = String::new();
    let mut chars = text.chars().peekable();
    while let Some(opener) = chars.next() {
        // A piece opens with a double quote, a single quote (JavaScript, or a
        // char that concat! joins) or a backquote (a template literal), and
        // closes on the same character.
        if !matches!(opener, '"' | '\'' | '`') {
            continue;
        }
        while let Some(c) = chars.next() {
            if c == '\\' {
                if let Some(escaped) = chars.next() {
                    value.push(match escaped {
                        'n' => '\n',
                        'r' => '\r',
                        't' => '\t',
                        other => other,
                    });
                }
            } else if c == opener {
                break;
            } else if c == '\r' && chars.peek() == Some(&'\n') {
                // A CRLF line break inside a literal reads as LF, in Rust and
                // in JavaScript alike, whatever the checkout's line endings.
                continue;
            } else {
                value.push(c);
            }
        }
    }
    value
}

fn ingest_ast_grep_matches(
    store: &Store,
    base: &str,
    json: &str,
    kind: &NamedNode,
    value_prop: &NamedNode,
    line_prop: &NamedNode,
) -> Result<(), Box<dyn std::error::Error>> {
    let matches: serde_json::Value = serde_json::from_str(json)?;
    let is_part_of = NamedNode::new_unchecked(DCTERMS_IS_PART_OF);
    let rdf_type = NamedNode::new_unchecked("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
    for m in matches.as_array().unwrap_or(&Vec::new()).iter() {
        let text = m["text"].as_str().unwrap_or_default();
        let line = m["range"]["start"]["line"].as_i64().unwrap_or(0) + 1; // ast-grep is 0-indexed
        let byte_start = m["range"]["byteOffset"]["start"].as_i64().unwrap_or(0);
        let file = m["file"].as_str().unwrap_or_default().replace('\\', &'/'.to_string());
        let value = joined_value(text);
        let kind_name = kind.as_str().rsplit('#').next().unwrap();
        // file + byte offset is unique within a single ast-grep run and
        // across separate runs for different folders alike (different
        // folders never share a file path) -- unlike a bare per-call
        // index, which collided across ingest_source_folder calls that
        // share a class (the-builder/src and pid1/src both rs:StringLiteral).
        let mut node = EXTRACTED_STRINGS.to_string();
        for part in [kind_name, file.as_str()] {
            node.push('/');
            node.push_str(part);
        }
        node.push('-');
        node.push_str(&byte_start.to_string());
        let node = NamedNode::new_unchecked(node);
        let mut file_iri = base.to_string();
        file_iri.push_str(&file);
        let file_iri = NamedNode::new_unchecked(file_iri);
        store.insert(oxigraph::model::QuadRef::new(&node, &rdf_type, kind, oxigraph::model::GraphNameRef::DefaultGraph))?;
        store.insert(oxigraph::model::QuadRef::new(&node, value_prop, oxigraph::model::LiteralRef::new_simple_literal(&value), oxigraph::model::GraphNameRef::DefaultGraph))?;
        store.insert(oxigraph::model::QuadRef::new(&node, line_prop, oxigraph::model::Literal::from(line).as_ref(), oxigraph::model::GraphNameRef::DefaultGraph))?;
        store.insert(oxigraph::model::QuadRef::new(&node, &is_part_of, &file_iri, oxigraph::model::GraphNameRef::DefaultGraph))?;
    }
    Ok(())
}

/// Runs ast-grep with `rule` against `folder`, ingesting matches as `class`
/// (rs:StringLiteral, js:String, ...). value/line property IRIs are derived
/// from the class itself (<class>.value, <class>.line) -- the same
/// convention the vendored rust/ast# and javascript/ast# vocabularies
/// already use, so no per-language constant is needed here.
fn ingest_source_folder(store: &Store, base: &str, folder: &str, rule: &str, class: &str) -> Result<(), Box<dyn std::error::Error>> {
    let output = run_named_command(C_AST_GREP_SCAN, &[("rule", rule), ("folder", folder)])?;
    ingest_ast_grep_matches(
        store,
        base,
        std::str::from_utf8(&output.stdout)?,
        &NamedNode::new_unchecked(class),
        &NamedNode::new_unchecked(dotted(class, PROP_VALUE)),
        &NamedNode::new_unchecked(dotted(class, PROP_LINE)),
    )
}

fn dotted(class: &str, property: &str) -> String {
    let mut iri = class.to_string();
    iri.push('.');
    iri.push_str(property);
    iri
}

fn term_value(term: &Term) -> String {
    match term {
        Term::NamedNode(n) => n.as_str().to_string(),
        Term::Literal(l) => l.value().to_string(),
        other => other.to_string(),
    }
}

fn run_command(command: &str) -> Result<(), Box<dyn std::error::Error>> {
    let status = shell().args([SHELL_COMMAND_OPTION, command]).status()?;
    if !status.success() {
        die(M_COMMAND_FAILED, &[("command", command)]);
    }
    Ok(())
}

/// Runs a copy step generically: publish-copies.rq says what to publish --
/// no path or hash is ever written in main.rs. For each row, the file is
/// taken from the commit (git show HEAD:<source>), never the working copy,
/// written to <target>, and its sha256 checked against what the model says
/// it must be. Any mismatch exits 1.
fn run_copy_step(store: &Store, catalog: &HashMap<String, String>, step: &str) -> Result<(), Box<dyn std::error::Error>> {
    let rows = run_named_query(store, catalog, Q_PUBLISH_COPIES, &[
        ("step", Term::NamedNode(NamedNode::new_unchecked(step))),
        ("base", our_base(store)),
    ]);
    for row in &rows {
        let source = term_string(row, "source").unwrap();
        let target = term_string(row, "target").unwrap();
        let expected_sha256 = term_string(row, "sha256").unwrap();

        let show = run_named_command(C_GIT_SHOW, &[("source", &source)])?;
        if !show.status.success() {
            die(M_GIT_SHOW_FAILED, &[("source", &source)]);
        }
        if let Some(parent) = std::path::Path::new(&target).parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(&target, &show.stdout)?;

        let hashed = run_named_command(C_SHA256SUM, &[("target", &target)])?;
        let actual_sha256 = std::str::from_utf8(&hashed.stdout)?
            .split_whitespace()
            .next()
            .unwrap_or_default();
        if actual_sha256 != expected_sha256 {
            die(M_HASH_MISMATCH, &[("target", &target), ("expected", &expected_sha256), ("actual", actual_sha256)]);
        }
        tell(&say(M_PUBLISHED, &[("target", &target), ("actual", actual_sha256)]));
    }
    Ok(())
}

/// A CommonMark text, but only as far as render-inputs.rq's own rule reads
/// it: the first line, "# " stripped, is the title; every blank-line-
/// separated block after it is one paragraph. A line that is only an
/// https:// URL becomes the paragraph's link, and does not count toward its
/// text; the paragraph's other lines, joined by a space, are its text.
/// Nothing else is interpreted -- no lists or emphasis.
fn parse_commonmark_lite(text: &str) -> (String, Vec<(String, Option<String>)>) {
    let is_bare_url = |line: &str| -> bool {
        let t = line.trim();
        !t.contains(char::is_whitespace) && t.split_once(':').is_some_and(|(_, rest)| rest.starts_with('/'))
    };
    let mut blocks: Vec<Vec<&str>> = Vec::new();
    let mut current: Vec<&str> = Vec::new();
    for line in text.lines() {
        if line.trim().is_empty() {
            if !current.is_empty() {
                blocks.push(std::mem::take(&mut current));
            }
        } else {
            current.push(line);
        }
    }
    if !current.is_empty() {
        blocks.push(current);
    }
    let mut blocks = blocks.into_iter();
    let title_block = blocks.next().unwrap_or_default().join(&'\n'.to_string());
    let title = title_block.strip_prefix('#').unwrap_or(&title_block).trim().to_string();
    let paragraphs = blocks
        .map(|block| {
            let mut link: Option<String> = None;
            let text_lines: Vec<&str> = block
                .into_iter()
                .filter(|line| {
                    if link.is_none() && is_bare_url(line) {
                        link = Some(line.trim().to_string());
                        false
                    } else {
                        true
                    }
                })
                .collect();
            (text_lines.join(&' '.to_string()).trim().to_string(), link)
        })
        .collect();
    (title, paragraphs)
}

/// A YAML value as the template sees it: a mapping is a map, a sequence is a
/// list, and every scalar is its text. A key that is not a string has no name a
/// template could write, so a mapping keeps only the keys that are strings.
fn yaml_to_data(value: &yaml_rust2::Yaml) -> mustache::Data {
    use yaml_rust2::Yaml;
    match value {
        Yaml::Hash(map) => mustache::Data::Map(
            map.iter()
                .filter_map(|(key, value)| key.as_str().map(|key| (key.to_string(), yaml_to_data(value))))
                .collect(),
        ),
        Yaml::Array(items) => mustache::Data::Vec(items.iter().map(yaml_to_data).collect()),
        Yaml::String(text) => mustache::Data::String(text.clone()),
        Yaml::Boolean(flag) => mustache::Data::Bool(*flag),
        Yaml::Integer(number) => mustache::Data::String(number.to_string()),
        Yaml::Real(text) => mustache::Data::String(text.clone()),
        _ => mustache::Data::String(String::new()),
    }
}

/// A query row as the template sees it: a boolean is a boolean, so a template
/// can ask whether it holds, and everything else is its text.
fn row_to_data(row: &HashMap<String, Term>) -> mustache::Data {
    let mut m = HashMap::new();
    for key in row.keys() {
        let value = match row.get(key) {
            Some(Term::Literal(literal)) if literal.datatype() == oxigraph::model::vocab::xsd::BOOLEAN => {
                mustache::Data::Bool(literal.value().parse::<bool>().unwrap_or(false))
            }
            _ => mustache::Data::String(term_string(row, key).unwrap()),
        };
        m.insert(key.clone(), value);
    }
    mustache::Data::Map(m)
}

/// Runs one render step: render-inputs.rq says what it reads and where it
/// writes. Each input's role is what it conforms to -- a Mustache template,
/// a SPARQL query (run on the main store, every row given to the template
/// as `rows`; ?step/?base are substituted only if the query itself selects
/// them), or CommonMark text (title and paragraphs). If the output entity
/// carries a pinned sha256, what was written is hashed and checked. No
/// template path, query path, output path or hash is ever written in
/// main.rs; render-inputs.rq supplies all of it.
fn run_render_step(store: &Store, catalog: &HashMap<String, String>, step: &str) -> Result<(), Box<dyn std::error::Error>> {
    let rows = run_named_query(store, catalog, Q_RENDER_INPUTS, &[
        ("step", Term::NamedNode(NamedNode::new_unchecked(step))),
        ("base", our_base(store)),
    ]);

    let mut template_path: Option<String> = None;
    let mut target: Option<String> = None;
    let mut expected_sha256: Option<String> = None;
    let mut context: HashMap<String, mustache::Data> = HashMap::new();

    for row in &rows {
        let input = term_string(row, "input").unwrap();
        let role = term_string(row, "role").unwrap();
        target = Some(term_string(row, "target").unwrap());
        expected_sha256 = expected_sha256.or_else(|| term_string(row, "sha256"));

        if role == ROLE_MUSTACHE {
            template_path = Some(input);
        } else if role == SPARQL11_QUERY {
            let query_text = std::fs::read_to_string(&input)?;
            let vars = select_vars(&query_text);
            let mut prepared = SparqlEvaluator::new().parse_query(&query_text)?;
            if vars.contains(VAR_STEP) {
                prepared = prepared.substitute_variable(Variable::new(VAR_STEP).unwrap(), Term::NamedNode(NamedNode::new_unchecked(step)));
            }
            if vars.contains(VAR_BASE) {
                prepared = prepared.substitute_variable(Variable::new(VAR_BASE).unwrap(), our_base(store));
            }
            let data_rows = collect_rows(prepared.on_store(store).execute()?, &input);
            // A query's rows go in under its own notation, or "rows".
            let key = term_string(row, "key").unwrap_or_else(|| "rows".to_string());
            context.insert(key, mustache::Data::Vec(data_rows.iter().map(row_to_data).collect()));
        } else if role == ROLE_YAML {
            // A page's copy: each top-level key fills the template under its own
            // name.
            let text = std::fs::read_to_string(&input)?;
            let documents = yaml_rust2::YamlLoader::load_from_str(&text)?;
            if let Some(yaml_rust2::Yaml::Hash(map)) = documents.first() {
                for (key, value) in map {
                    if let Some(key) = key.as_str() {
                        context.insert(key.to_string(), yaml_to_data(value));
                    }
                }
            }
        } else if role == ROLE_COMMONMARK {
            let text = std::fs::read_to_string(&input)?;
            let (title, paragraphs) = parse_commonmark_lite(&text);
            context.insert("title".to_string(), mustache::Data::String(title));
            context.insert(
                "paragraphs".to_string(),
                mustache::Data::Vec(
                    paragraphs
                        .into_iter()
                        .map(|(text, link)| {
                            let mut m = HashMap::new();
                            m.insert("text".to_string(), mustache::Data::String(text));
                            if let Some(link) = link {
                                m.insert("link".to_string(), mustache::Data::String(link));
                            }
                            mustache::Data::Map(m)
                        })
                        .collect(),
                ),
            );
        } else {
            die(M_UNKNOWN_ROLE, &[("step", step), ("role", &role)]);
        }
    }

    let template_path = template_path.unwrap_or_else(|| die(M_NO_TEMPLATE, &[("step", step)]));
    let target = target.unwrap_or_else(|| die(M_NO_TARGET, &[("step", step)]));

    let template_text = std::fs::read_to_string(&template_path)?;
    let compiled = mustache::compile_str(&template_text)
        .unwrap_or_else(|e| die(M_COMPILE_FAILED, &[("template", &template_path), ("e", &e.to_string())]));
    let mut out = Vec::new();
    compiled
        .render_data(&mut out, &mustache::Data::Map(context))
        .unwrap_or_else(|e| die(M_RENDER_FAILED, &[("template", &template_path), ("e", &e.to_string())]));

    if let Some(parent) = std::path::Path::new(&target).parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&target, &out)?;

    if let Some(expected) = expected_sha256 {
        let hashed = run_named_command(C_SHA256SUM, &[("target", &target)])?;
        let actual = std::str::from_utf8(&hashed.stdout)?.split_whitespace().next().unwrap_or_default();
        if actual != expected {
            die(M_HASH_MISMATCH, &[("target", &target), ("expected", &expected), ("actual", actual)]);
        }
        tell(&say(M_RENDERED_MATCHES, &[("target", &target), ("actual", actual)]));
    } else {
        tell(&say(M_RENDERED, &[("target", &target)]));
    }
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    let dry_run = args.iter().any(|a| a == "--dry-run");
    // A plain run verifies and ships nothing; only --ship runs a ship step.
    let ship = args.iter().any(|a| a == "--ship");
    let catalog_path_arg = args
        .iter()
        .position(|a| a == "--catalog")
        .and_then(|i| args.get(i + 1))
        .unwrap_or_else(|| die(M_CATALOG_REQUIRED, &[]));

    let catalog = parse_catalog(catalog_path_arg);
    let store = Store::new()?;
    load_transitively(&store, &catalog, vec![AH_TTL.to_string()], &HashSet::new())?;
    record_definitions(&store, &catalog)?;
    load_messages(&store);

    let steps = plan_steps(&store, &catalog, PLAN);
    let mut edges = step_precedes(&store, &catalog, PLAN);
    // A ready step waits for every check, so no check can be added without it.
    let ready_steps: HashSet<String> = steps.iter().filter(|s| s.ready).map(|s| s.iri.as_str().to_string()).collect();
    for r in &ready_steps {
        for s in steps.iter().filter(|s| s.command.is_none() && !s.copy && !s.render && !s.ready) {
            edges.push((r.clone(), s.iri.as_str().to_string()));
        }
    }
    let order = order_steps(&steps, &edges);
    let by_iri: HashMap<String, &Step> = steps.iter().map(|s| (s.iri.as_str().to_string(), s)).collect();

    if dry_run {
        for iri in &order {
            let step = by_iri[iri];
            let title = step.title.clone().unwrap_or_else(|| iri.clone());
            tell(&say(M_DRY_RUN_STEP, &[("title", &title), ("command", &step.command.clone().unwrap_or_default())]));
        }
        return Ok(());
    }

    let mut failed_checks: HashSet<String> = HashSet::new();
    let mut open_gaps: HashSet<String> = HashSet::new();
    for iri in &order {
        let step = by_iri[iri];
        let is_build_like = step.command.is_some() || step.copy || step.render;
        if is_build_like {
            let step_ancestors = ancestors(iri, &edges);
            let blocking: Vec<&String> = step_ancestors.intersection(&failed_checks).collect();
            if !blocking.is_empty() {
                tell(&say(M_SKIPPED, &[("upstream", blocking[0]), ("title", &step.title.clone().unwrap_or_else(|| iri.clone()))]));
                continue;
            }
            let hold_ancestors = ancestors_to_ready(iri, &edges, &ready_steps);
            let held: Vec<&String> = hold_ancestors.intersection(&open_gaps).collect();
            if !held.is_empty() {
                tell(&say(M_HELD, &[("upstream", held[0]), ("title", &step.title.clone().unwrap_or_else(|| iri.clone()))]));
                continue;
            }
            // A step that waits for a version to be taken is held until the model
            // holds a signed taking of that version.
            let untaken = run_named_query(&store, &catalog, Q_UNTAKEN, &[("step", Term::NamedNode(NamedNode::new_unchecked(iri.as_str())))]);
            if let Some(row) = untaken.first() {
                tell(&say(M_UNTAKEN, &[
                    ("needed", &term_string(row, "needed").unwrap()),
                    ("version", &term_string(row, "version").unwrap()),
                    ("reason", &term_string(row, "reason").unwrap_or_default()),
                    ("title", &step.title.clone().unwrap_or_else(|| iri.clone())),
                ]));
                continue;
            }
            if step.ship && !ship {
                tell(&say(M_NOT_SHIPPED, &[("title", &step.title.clone().unwrap_or_else(|| iri.clone()))]));
                continue;
            }
        }
        match &step.command {
            Some(command) => {
                tell(&step.title.clone().unwrap_or_else(|| iri.clone()));
                run_command(command)?;
                if iri == SCAN_STEP {
                    let output = run_named_command(C_LIST_FILES, &[])?;
                    ingest_disk_scan(&store, std::str::from_utf8(&output.stdout)?)?;
                } else if iri == COMMIT_STEP {
                    let output = run_named_command(C_HEAD_COMMIT, &[])?;
                    ingest_head_commit(&store, std::str::from_utf8(&output.stdout)?)?;
                } else if iri == EXTRACT_STRINGS_STEP {
                    let scope = run_named_query(&store, &catalog, Q_CODE_SCOPE, &[
                        ("step", Term::NamedNode(NamedNode::new_unchecked(EXTRACT_STRINGS_STEP))),
                        ("base", our_base(&store)),
                    ]);
                    for row in &scope {
                        let folder = term_string(row, "folder").unwrap();
                        let rule = term_string(row, "rule").unwrap();
                        let class = term_string(row, "class").unwrap();
                        ingest_source_folder(&store, &term_value(&our_base(&store)), &folder, &rule, &class)?;
                    }
                }
            }
            None if step.copy => {
                tell(&step.title.clone().unwrap_or_else(|| iri.clone()));
                run_copy_step(&store, &catalog, iri)?;
            }
            None if step.ready => {
                tell(&step.title.clone().unwrap_or_else(|| iri.clone()));
                if !failed_checks.is_empty() {
                    failed_checks.insert(iri.clone());
                }
                let mut gaps: Vec<&String> = open_gaps.iter().collect();
                gaps.sort();
                for gap in gaps {
                    tell(&say(M_PROCEEDING, &[("gap", gap)]));
                }
            }
            None if step.render => {
                tell(&step.title.clone().unwrap_or_else(|| iri.clone()));
                run_render_step(&store, &catalog, iri)?;
            }
            None => match run_query_step(&store, &catalog, iri)? {
                CheckOutcome::Failed => { failed_checks.insert(iri.clone()); }
                CheckOutcome::OpenGap => { open_gaps.insert(iri.clone()); }
                CheckOutcome::Passed => {}
            },
        }
    }

    if !failed_checks.is_empty() {
        die(M_CHECKS_FAILED, &[]);
    }
    Ok(())
}
