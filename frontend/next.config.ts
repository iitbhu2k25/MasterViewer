import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [

      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },

    ],
  },
  async rewrites() {
    return [
      {
        source: "/assi/:path*",
        destination: "https://holistic.pythonanywhere.com/assi/:path*",
      },
    ]
  },
}

export default nextConfig





// import type { NextConfig } from "next"

// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [

//       {
//         protocol: 'https',
//         hostname: 'images.pexels.com',
//         pathname: '/**',
//       },

//     ],
//   },
//   async rewrites() {
//     return [
//       {
//         source: "/assi/:path*",
//         destination: "http://localhost:9000/assi/:path*",
//       },
//     ]
//   },
// }

// export default nextConfig
