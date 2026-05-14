import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import svelte, { vitePreprocess } from "@astrojs/svelte";
import { heicImportPlugin } from './src/image-service/heic-import-plugin';
import remarkGfm from 'remark-gfm'
import smartypants from 'remark-smartypants'
import emoji from 'remark-emoji'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import type { Options as AutolinkOptions, Build } from 'rehype-autolink-headings'
import slug from 'rehype-slug'
import { visit } from 'unist-util-visit'
import GitHubSlugger from 'github-slugger'
import rehypeExternalLinks from 'rehype-external-links'

// https://astro.build/config
export default defineConfig({
  prefetch: true,
  site: 'https://umgefahren.xyz',
  integrations: [mdx(), sitemap(), svelte({ preprocess: vitePreprocess({ script: true }) })],
  vite: {
    plugins: [heicImportPlugin(), tailwindcss()],
    build: {
      // maplibre-gl is ~1MB and is already isolated in its own chunk via
      // dynamic import in FlightMap; the warning is purely informational.
      chunkSizeWarningLimit: 1100,
    },
  },
  image: {
    service: { entrypoint: './src/image-service/jxl-sharp.ts' },
  },
  build: {
    assets: "assets"
  },
  markdown: {
    remarkPlugins: [
      remarkGfm,
      smartypants,
      emoji,
    ],
    rehypePlugins: [
      // Compute heading IDs that look at <HoverForHangul roman="..." />.
      // rehype-slug alone gives empty/garbage IDs for headings whose visible
      // text is a JSX component, since those nodes have no text content at
      // rehype time. We walk each heading, build a slug source from text +
      // 'roman' attributes, then set node.properties.id so rehype-slug becomes
      // a no-op for these. rehype-slug stays in the chain as a fallback for
      // headings without JSX.
      () => (tree: any) => {
        const slugs = new GitHubSlugger();
        const headingText = (node: any): string => {
          const parts: string[] = [];
          for (const child of node.children ?? []) {
            if (child.type === 'text') {
              parts.push(child.value);
            } else if (
              child.type === 'mdxJsxTextElement' ||
              child.type === 'mdxJsxFlowElement'
            ) {
              const roman = child.attributes?.find?.(
                (a: any) => a.type === 'mdxJsxAttribute' && a.name === 'roman',
              )?.value;
              if (typeof roman === 'string') parts.push(roman);
            } else if (child.children) {
              parts.push(headingText(child));
            }
          }
          return parts.join(' ').replace(/\s+/g, ' ').trim();
        };
        visit(tree, 'element', (node: any) => {
          if (!node.tagName?.startsWith?.('h')) return;
          if (node.properties?.id === 'footnote-label') return;
          const text = headingText(node);
          if (!text) return;
          node.properties = node.properties ?? {};
          node.properties.id = slugs.slug(text);
        });
      },
      slug,
      [rehypeAutolinkHeadings, {
        behavior: 'prepend', content: (((a) => {
          if (a.type !== 'element') return []
          if (a.properties.id === 'footnote-label') return []
          if (!a.tagName.startsWith('h')) return []
          const headingNumber = /^h(\d)/.exec(a.tagName)![1]
          const hashTags = '#'.repeat(parseInt(headingNumber))
          return {
            type: 'element',
            tagName: 'span',
            children: [
              {
                type: 'text',
                value: hashTags
              }
            ],
            properties: {
              className: 'hash-link',
              "data-astro-reload": '',
            }
          }
        }) satisfies Build),
      } satisfies AutolinkOptions],
      [rehypeExternalLinks, { rel: ['noopener', 'noreferrer', 'nofollow'], target: '_blank' }],
    ]
  }
});
