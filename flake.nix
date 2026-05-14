{
  description = "umgefahren-astro-blog";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.bun2nix.url = "github:nix-community/bun2nix";
  inputs.bun2nix.inputs.nixpkgs.follows = "nixpkgs";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  nixConfig = {
    extra-substituters = [
      "https://nix-community.cachix.org"
    ];
    extra-trusted-public-keys = [
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  outputs =
    {
      self,
      nixpkgs,
      bun2nix,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ bun2nix.overlays.default ];
        };
        b2n = bun2nix.packages.${system}.default;

        # Keep the build's source narrow so the nix store hash doesn't churn
        # on every node_modules/dist change.
        src = pkgs.lib.cleanSourceWith {
          src = ./.;
          filter =
            path: _:
            let
              base = baseNameOf path;
            in
            !(builtins.elem base [
              "node_modules"
              "dist"
              ".astro"
              ".direnv"
              "result"
              "bunny"
              "flake.lock"
            ])
            && !(pkgs.lib.hasSuffix ".log" base);
        };
      in
      {
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "umgefahren-astro-blog";
          version = "0.0.1";
          inherit src;

          nativeBuildInputs = [
            b2n.hook
            # libjxl provides the `cjxl` binary used by the custom Astro image
            # service (src/image-service/jxl-sharp.ts) for JPEG XL output.
            pkgs.libjxl
          ];

          bunDeps = b2n.fetchBunDeps { bunNix = ./bun.nix; };

          # The image service reads $CJXL when set, falling back to PATH.
          # Setting both belt-and-suspenders.
          CJXL = "${pkgs.libjxl}/bin/cjxl";

          buildPhase = ''
            runHook preBuild
            bun run build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp -r dist/. $out/
            runHook postInstall
          '';

          # Pure static assets — no shebangs to patch, no RPATH to mangle.
          dontFixup = true;
        };

        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            pnpm
            libjxl
            bun
            b2n
          ];
        };
      }
    );
}
