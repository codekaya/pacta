WASM_TARGET := wasm32v1-none
WASM := target/$(WASM_TARGET)/release/x402_upto.wasm
NETWORK ?= testnet
SOURCE ?= default

.PHONY: all build test fmt lint check optimize deploy clean

all: check build

## Compile the contract to wasm.
build:
	cargo build --workspace --target $(WASM_TARGET) --release
	@ls -l $(WASM) 2>/dev/null || true

## Run the contract test suite in the host emulator.
test:
	cargo test --workspace

fmt:
	cargo fmt --all

## Everything CI enforces.
check:
	cargo fmt --all -- --check
	cargo clippy --workspace --all-targets -- -D warnings
	cargo test --workspace

lint:
	cargo clippy --workspace --all-targets -- -D warnings

## Shrink the wasm before deploying. Requires stellar-cli >= 23.
optimize: build
	stellar contract optimize --wasm $(WASM)

## Deploy to $(NETWORK) using the $(SOURCE) identity.
deploy: build
	stellar contract deploy \
		--wasm $(WASM) \
		--source $(SOURCE) \
		--network $(NETWORK)

clean:
	cargo clean
