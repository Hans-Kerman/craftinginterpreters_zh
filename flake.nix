# 手撸解释器教程（Crafting Interpreters 中文翻译）→ mdBook 静态阅读器
#
# 消费方式（nix-config 侧）：
#   inputs.craftinginterpreters-zh.url = "github:Hans-Kerman/craftinginterpreters_zh";
#   services.ci-reader.package = inputs.craftinginterpreters-zh.packages.x86_64-linux.default;
#
# 注意：flake 的源过滤只打包 git 已跟踪文件，新增文件（book.toml/SUMMARY.md/theme 等）
# 必须先 commit，否则构建产物会缺文件且不报错。
{
  description = "手撸解释器教程（Crafting Interpreters 中文翻译）mdBook 静态站";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
      pkgsFor = system: nixpkgs.legacyPackages.${system};
    in
    {
      packages = forAllSystems (system:
        let pkgs = pkgsFor system; in
        {
          default = pkgs.stdenv.mkDerivation {
            pname = "craftinginterpreters-zh";
            version = "0.0.1"; # 与 book.json 的 version 对齐
            src = self;
            nativeBuildInputs = [ pkgs.mdbook ];

            # book.toml 不配置额外 [output] 后端时，单后端产物直接落在
            # build-dir（默认 ./book/，index.html 位于 book/index.html），无 html/ 子目录
            dontConfigure = true;
            buildPhase = ''
              runHook preBuild
              mdbook build
              runHook postBuild
            '';
            installPhase = ''
              runHook preInstall
              mkdir -p $out
              cp -r book/. $out/
              runHook postInstall
            '';
          };
        });

      devShells = forAllSystems (system:
        let pkgs = pkgsFor system; in
        {
          default = pkgs.mkShell {
            packages = [ pkgs.mdbook ];
          };
        });
    };
}
