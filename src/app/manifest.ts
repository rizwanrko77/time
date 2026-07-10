import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TIME - by iamrizwan.com',
    short_name: 'TIME',
    description: 'Allocate your time across commitments, track hours with a built-in timer.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/app-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/app-icon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable',
      }
    ],
  }
}
