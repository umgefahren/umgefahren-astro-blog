import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import svelte from "@astrojs/svelte";
import solidJs from "@astrojs/solid-js";
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
  integrations: [mdx(), sitemap(), svelte(), solidJs()],
  vite: {
    plugins: [tailwindcss()],
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
      slug,
      () => {
        const slugs = new GitHubSlugger()
        return (tree) => {
          visit(tree, 'element', (node) => {
            if (node.tagName.startsWith('h') && node.properties.id === '') {
              const child = node.children.at(0)
              if (child?.type === 'element') {
                const hoverForHangul = child.children.at(0)
                const attributes = hoverForHangul?.attributes
                try {
                  attributes.forEach(({ name, value }) => {
                    if (name === 'roman') {
                      const slug = slugs.slug(value)
                      node.properties.id += slug
                    }
                  })
                } catch {
                }
              }
            }
          })
        }
      },
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
