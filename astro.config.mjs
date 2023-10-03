import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";
import { astroImageTools } from 'astro-imagetools';
import prefetch from "@astrojs/prefetch";
import svelte from "@astrojs/svelte";

export default defineConfig({
  site: 'https://umgefahren.xyz',
  integrations: [mdx(), sitemap(), tailwind(), prefetch(), svelte(), astroImageTools],
  build: {
    assets: "assets"
  }
});
