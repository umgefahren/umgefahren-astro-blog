{
  description = "umgefahren-astro-blog build environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          # libjxl provides the cjxl CLI used by the custom Astro image service
          # in src/image-service/jxl-sharp.ts for JPEG XL output.
          packages = [
            pkgs.nodejs_22
            pkgs.pnpm
            pkgs.libjxl
          ];
        };
      });
}
