export type CatalogueItem = {
  name: string;
  price: string;
  img: string;
  status: "Published";
  order: number;
};

export type ServiceItem = {
  name: string;
  desc: string;
  img: string;
  status: "Published";
  order: number;
};

export type ProjectItem = {
  title: string;
  country: string;
  year: string;
  tagsList: string[];
  desc: string;
  img: string;
  imageAlt: string;
  status: "Published";
  order: number;
};

export type TestimonialItem = {
  name: string;
  company: string;
  quote: string;
  photo: string;
  status: "Published";
  order: number;
};

export type FaqItem = {
  q: string;
  ans: string;
  status: "Published";
  order: number;
};

export const siteSettings = {
  title: "Kitari Studio",
  location: "Malang, Indonesia GMT+7",
  email: "hello@kitaristudio.com",
  phone: "+62 895 1284 2356",
  whatsapp: "+6289512842356",
  heroTagline:
    "We build brands and digital products for startups and growing businesses.",
  heroCard1:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478478/kitari-studio/site-assets/rectangle-30-692892b806.webp",
  heroCard2:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478479/kitari-studio/site-assets/rectangle-31-0dc8e3a0f8.webp",
  heroCard3:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478478/kitari-studio/site-assets/rectangle-29-30243024f4.webp",
  heroCard4:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478476/kitari-studio/site-assets/rectangle-26-84f011a446.webp",
  heroCard5:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478477/kitari-studio/site-assets/rectangle-28-dfdad7c8bd.webp",
  heroCard6:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478475/kitari-studio/site-assets/rectangle-25-4b3150769e.webp",
  heroCard7:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478477/kitari-studio/site-assets/rectangle-27-f582d47b93.webp",
  heroCard8:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478480/kitari-studio/site-assets/rectangle-32-9936a233ce.webp",
  heroCard9:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478481/kitari-studio/site-assets/rectangle-33-6b81f17f3d.webp",
  heroCard10:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478481/kitari-studio/site-assets/rectangle-50-09c4086139.webp",
  aboutText:
    "Kitari Studio is a creative studio helping businesses build brands, digital products, websites, and experiences through thoughtful design, development, and creative solutions made to look good, work well, and grow with them while keeping every detail purposeful and human.",
  aboutImage:
    "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478475/kitari-studio/site-assets/rectangle-25-4b3150769e.webp",
  aboutImageAlt: "Kitari Studio project preview",
  aboutStat1Value: "5+",
  aboutStat1Label: "Years of Experience in Creative Work",
  aboutStat2Value: "40+",
  aboutStat2Label: "Projects Completed for Businesses",
  aboutStat3Value: "30+",
  aboutStat3Label: "Clients and Partners We’ve Worked With",
  aboutStat4Value: "10+",
  aboutStat4Label: "Countries Our Work Has Reached",
  homeNavHome: "Home",
  homeNavAbout: "About",
  homeNavServices: "Services",
  homeNavWork: "Our Work",
  homeNavCatalogue: "Catalogue",
  homeNavTestimonials: "Testimonial",
  homeNavFaq: "FAQ",
  homeScheduleCall: "Schedule a Call",
  homeCatalogueEyebrow: "SERVICE CATALOGUE",
  homeCatalogueTitle: "Find What Your Brand Needs to Grow",
  homeBookCall: "Book a Call",
  homeStartingPrice: "Start from",
  homeAboutEyebrow: "ABOUT KITARI",
  homeServicesEyebrow: "SERVICES",
  homeServicesTitle: "What We Can Build",
  homeServicesDescription:
    "Every idea has a story to tell, and we help shape it into something worth experiencing.",
  homeWorkEyebrow: "OUR WORK",
  homeWorkTitle: "Some Ideas We’ve Helped Bring to Life",
  homeWorkDescription:
    "Every project comes with its own story, challenge, and direction. Here are a few we’ve had the chance to shape along the way.",
  homeProjectDetails: "VIEW DETAIL PROJECT",
  homeSeeAllWork: "SEE ALL WORK",
  homeTestimonialsTitle: "Proof That We Deliver Straight Up",
  homeTestimonialsDescription:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  homeFaqEyebrow: "FAQ’S",
  homeFaqTitle: "Got Question? Find Your Answer Here",
  homeFaqDescription:
    "A few things you might want to know before we start working together.",
  homeCtaHeading:
    "Have an idea in mind? Let’s shape it, build it, and bring it into the world.",
  homeCtaWorkLink: "See Our Work",
  homeFooterDescription:
    "Kitari Studio is a creative studio helping businesses build brands, digital products, websites, and experiences that move them forward.",
  homeFooterPagesHeading: "PAGES",
  homeFooterHomeLink: "Home",
  homeFooterServicesLink: "Service",
  homeFooterPortfolioLink: "Portofolio",
  homeFooterWhiteLabelLink: "White Label",
  homeFooterRecentWorksHeading: "RECENT WORKS",
  homeFooterRecentWork1: "Contractor",
  homeFooterRecentWork2: "Amiya Rosa",
  homeFooterRecentWork3: "Glorius Studio",
  homeFooterRecentWork4: "Shaistanaya City",
  homeFooterSocialsHeading: "SOCIALS",
  homeFooterInstagram: "Instagram",
  homeFooterLinkedIn: "LinkedIn",
  homeFooterTikTok: "Tiktok",
  homeFooterFacebook: "Facebook",
  homeFooterYouTube: "YouTube",
  homeFooterLocationHeading: "LOCATION",
  homeFooterNewsletterHeading: "NEWSLETTER",
  homeFooterEmailLabel: "Email address",
  homeFooterEmailPlaceholder: "Enter your email",
  homeFooterSubscribeLabel: "Subscribe",
  homeFooterNewsletterPolicy: "By subscribing, you’re accept our policy",
  homeFooterNewsletterSuccess: "Thanks for subscribing.",
  homeFooterInquiryHeading: "INQUIRY",
  homeFooterOpenPositionHeading: "OPEN POSITION",
  homeFooterOpenPosition1: "Senior Webflow Developer",
  homeFooterOpenPosition2: "UI/UX Designer",
  homeFooterCopyright: "© Copyright 2026, All right reserved. Kitari Studio",
  instagramUrl: "",
  linkedinUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  siteFontFamily: "Geist" as const,
  siteTextScale: 1,
  siteHeadingScale: 1,
  siteBodyScale: 1,
  siteNavScale: 1,
  siteButtonScale: 1,
};

export const catalogue: CatalogueItem[] = [
  {
    name: "Landing Page Website",
    price: "$79",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478475/kitari-studio/site-assets/rectangle-25-4b3150769e.webp",
    status: "Published",
    order: 1,
  },
  {
    name: "Full Website",
    price: "$209",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478476/kitari-studio/site-assets/rectangle-26-84f011a446.webp",
    status: "Published",
    order: 2,
  },
  {
    name: "SaaS Dashboard",
    price: "$449",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478480/kitari-studio/site-assets/rectangle-32-9936a233ce.webp",
    status: "Published",
    order: 3,
  },
];

export const statistics = [
  { value: "5+", label: "Years of experience in creative work" },
  { value: "40+", label: "Projects completed for businesses" },
  { value: "30+", label: "Clients and partners we have worked with" },
  { value: "10+", label: "Countries our work has reached" },
];

export const services: ServiceItem[] = [
  {
    name: "Website",
    desc: "We build websites with WordPress, Framer, Webflow, or custom code, with responsive design and basic SEO built in.",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478475/kitari-studio/site-assets/rectangle-25-4b3150769e.webp",
    status: "Published",
    order: 1,
  },
  {
    name: "SaaS Dashboard",
    desc: "Turn your business tools into one clear SaaS dashboard, from CRM and projects to clients, data, and workflows.",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478480/kitari-studio/site-assets/rectangle-32-9936a233ce.webp",
    status: "Published",
    order: 2,
  },
  {
    name: "Mobile App",
    desc: "Bring your app idea to life with a custom mobile experience built for iOS, Android, and your users.",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478478/kitari-studio/site-assets/rectangle-30-692892b806.webp",
    status: "Published",
    order: 3,
  },
  {
    name: "Product Template",
    desc: "Start faster with ready-made Webflow, WordPress, and UI templates designed for real projects and products.",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478477/kitari-studio/site-assets/rectangle-28-dfdad7c8bd.webp",
    status: "Published",
    order: 4,
  },
];

export const projects: ProjectItem[] = [
  {
    title: "Contractor Management",
    country: "Australia",
    year: "2026",
    desc: "We shaped the brand from the ground up, bringing its mobile app and SaaS dashboard together through one polished visual language.",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478474/kitari-studio/site-assets/contractormanajement-515c2b1d56.webp",
    imageAlt: "Contractor management website and product experience",
    tagsList: ["Branding", "Website", "Mobile App"],
    status: "Published",
    order: 1,
  },
  {
    title: "Amiya Rosa",
    country: "Philippines",
    year: "2026",
    desc: "We reimagined the entire website into a refined digital home, giving Amiya Rosa's properties the space and presence they deserve.",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478471/kitari-studio/site-assets/amiyarosa-bb28746a4f.webp",
    imageAlt: "Amiya Rosa property website",
    tagsList: ["Website"],
    status: "Published",
    order: 2,
  },
  {
    title: "Shaistanaya City",
    country: "Indonesia",
    year: "2024",
    desc: "We redesigned and developed the website from the ground up, creating a more polished experience for showcasing Shaistanaya City.",
    img: "https://res.cloudinary.com/dpfh30b2v/image/upload/v1792478484/kitari-studio/site-assets/shaistanayacity-c0cae0e6be.webp",
    imageAlt: "Shaistanaya City property website",
    tagsList: ["Website"],
    status: "Published",
    order: 3,
  },
];

export const testimonials: TestimonialItem[] = [
  {
    name: "Pauline Ty",
    company: "Amiya Rosa · Philippines",
    quote:
      "Creative, responsive, and professional. Kitari Studio turned our vision into beautiful designs. Highly recommended!",
    photo: "",
    status: "Published",
    order: 1,
  },
  {
    name: "Jerome Choppin",
    company: "France",
    quote:
      "Kitari Studio delivered a seamless creative experience, combining thoughtful design, clear communication, and outstanding results.",
    photo: "",
    status: "Published",
    order: 2,
  },
  {
    name: "Samuel Donato",
    company: "Australia",
    quote:
      "Our healthcare website now feels modern, clean, and intuitive, thanks to Kitari Studio's thoughtful redesign.",
    photo: "",
    status: "Published",
    order: 3,
  },
  {
    name: "Porty Ushan",
    company: "Aloka Team · Australia",
    quote:
      "From branding to website and mobile app, the entire experience was seamless, cohesive, and thoughtfully executed.",
    photo: "",
    status: "Published",
    order: 4,
  },
];

export const faqItems: FaqItem[] = [
  {
    q: "What kind of projects do you work on?",
    ans: "We specialize in websites, mobile apps, SaaS dashboards, and brand experiences, from interface design through development.",
    status: "Published",
    order: 1,
  },
  {
    q: "Can you handle both design and development?",
    ans: "Yes. We can support design and development based on your project needs, bringing visual quality and functionality together.",
    status: "Published",
    order: 2,
  },
  {
    q: "How does a project usually start?",
    ans: "We start with a conversation about your goals, ideas, and requirements. From there, we align on a direction, project scope, timeline, and next steps.",
    status: "Published",
    order: 3,
  },
  {
    q: "Can you work with our existing brand or design?",
    ans: "Yes. We can build on your existing brand guidelines and design files, or help refine them to fit the project.",
    status: "Published",
    order: 4,
  },
  {
    q: "Do you work with teams and agencies?",
    ans: "Yes. We collaborate with in-house teams and agencies, including white-label project partnerships.",
    status: "Published",
    order: 5,
  },
];
