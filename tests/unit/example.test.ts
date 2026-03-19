import { describe, it, expect } from 'vitest'
import { seo } from '~/lib/seo'

describe('seo', () => {
  it('returns meta tags with title and description', () => {
    const tags = seo({ title: 'Test Title', description: 'Test description' })

    expect(tags).toContainEqual({ title: 'Test Title' })
    expect(tags).toContainEqual({ name: 'description', content: 'Test description' })
    expect(tags).toContainEqual({ name: 'og:title', content: 'Test Title' })
  })

  it('includes image tags when image is provided', () => {
    const tags = seo({ title: 'Test', image: 'https://example.com/img.png' })

    expect(tags).toContainEqual({ name: 'og:image', content: 'https://example.com/img.png' })
    expect(tags).toContainEqual({ name: 'twitter:card', content: 'summary_large_image' })
  })

  it('excludes image tags when no image is provided', () => {
    const tags = seo({ title: 'Test' })

    const imageTag = tags.find((t) => 'name' in t && t.name === 'og:image')
    expect(imageTag).toBeUndefined()
  })
})
