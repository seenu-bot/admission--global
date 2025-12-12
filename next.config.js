/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd13loartjoc1yn.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'example.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
  async redirects() {
    return [
      // Redirect /exams/articles.html to /articles
      {
        source: '/exams/articles.html',
        destination: '/articles',
        permanent: true,
      },
      // Redirect /articles.html to /articles
      {
        source: '/articles.html',
        destination: '/articles',
        permanent: true,
      },
      // Redirect /articles/articles to /articles (fix for double path issue)
      {
        source: '/articles/articles',
        destination: '/articles',
        permanent: true,
      },
      // Redirect /news.html to /news
      {
        source: '/news.html',
        destination: '/news',
        permanent: true,
      },
      // Redirect /news/news to /news (fix for double path issue)
      {
        source: '/news/news',
        destination: '/news',
        permanent: true,
      },
      // Redirect /online-courses.html to /online-courses
      {
        source: '/online-courses.html',
        destination: '/online-courses',
        permanent: true,
      },
      // Redirect /online-courses/online-courses to /online-courses (fix for double path issue)
      {
        source: '/online-courses/online-courses',
        destination: '/online-courses',
        permanent: true,
      },
      // Redirect /study-abroad.html to /study-abroad
      {
        source: '/study-abroad.html',
        destination: '/study-abroad',
        permanent: true,
      },
      // Redirect /study-abroad/study-abroad to /study-abroad (fix for double path issue)
      {
        source: '/study-abroad/study-abroad',
        destination: '/study-abroad',
        permanent: true,
      },
      // Redirect /about-us.html to /about-us
      {
        source: '/about-us.html',
        destination: '/about-us',
        permanent: true,
      },
      // Redirect /about-us/about-us to /about-us (fix for double path issue)
      {
        source: '/about-us/about-us',
        destination: '/about-us',
        permanent: true,
      },
      // Redirect duplicate redirect pages to their destinations
      {
        source: '/course/overall',
        destination: '/exams/overall',
        permanent: true,
      },
      {
        source: '/course/internships',
        destination: '/internships',
        permanent: true,
      },
      {
        source: '/course/jobs',
        destination: '/jobs',
        permanent: true,
      },
      {
        source: '/exams/internships',
        destination: '/internships',
        permanent: true,
      },
      {
        source: '/exams/jobs',
        destination: '/jobs',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Support pretty paths like /exams-mbbs → /exams/mbbs
      {
        source: '/exams-:slug',
        destination: '/exams/:slug',
      },
    ];
  },
};

module.exports = nextConfig;


