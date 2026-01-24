//! Build script for Risc0 host
//! Compiles the guest program and generates method bindings

fn main() {
    risc0_build::embed_methods();
}
