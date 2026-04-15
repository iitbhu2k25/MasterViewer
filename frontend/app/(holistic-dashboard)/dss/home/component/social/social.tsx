'use client'
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Twitter, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";
declare global {
 interface Window{
  twttr: any;
 }  
}

const socialItems = [
  {
    type: "twitter-post",
    profileName: "JalTattva",
    tweetId: "1853469371840238068",
    imgSrc: "/Images/Social/twitter.jpg",
    alt: "Twitter Feed",
    title: "Twitter",
    icon: <Twitter className="w-8 h-8 text-blue-400 mx-auto mt-2" />,
  },
  {
    type: "facebook",
    pageUrl: "ministryofjalsakthi",
    imgSrc: "/Images/Social/facebook.jpg",
    alt: "Facebook Page",
    title: "Facebook",
    icon: <Facebook className="w-8 h-8 text-blue-600 mx-auto mt-2" />,
  },
  {
    type: "youtube",
    videoId: "KY57d0zNkoM",
    articleUrl: "https://www.slcrvaranasi.com/post/innovative-effort-to-rejuvenate-small-rivers-with-smart-laboratory-at-iit-bhu",
    imgSrc: "/Images/Social/youtube.jpg",
    alt: "YouTube Channel",
    title: "YouTube",
    icon: <Youtube className="w-8 h-8 text-red-600 mx-auto mt-2" />,
  },
  {
    type: "linkedin",
    profileUrl: "linkedin.com/in/slcr-smart-laboratory-on-clean-rivers-b65a4134a",
    imgSrc: "/Images/Social/linkedin.jpg",
    alt: "LinkedIn Profile",
    title: "LinkedIn",
    icon: <Linkedin className="w-8 h-8 text-blue-700 mx-auto mt-2" />,
  },
  {
    type: "instagram",
    profileName: "jalsakthi_",
    imgSrc: "/Images/Social/instagram.jpg",
    alt: "Instagram Feed",
    title: "Instagram",
    icon: <Instagram className="w-8 h-8 text-pink-500 mx-auto mt-2" />,
  }
];

export default function SocialGridSection() {
  const twitterScriptRef = useRef<HTMLScriptElement|null>(null);
  const facebookScriptRef = useRef<HTMLScriptElement|null>(null);
  const linkedinScriptRef = useRef<HTMLScriptElement|null>(null);
  
  useEffect(() => {
    // Load Twitter widget script
    if (!twitterScriptRef.current) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.body.appendChild(script);
      twitterScriptRef.current = script;

      // Force widget creation once script loads
      script.onload = () => {
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load();
        }
      };
    } else {
      // If script already loaded, force widget creation
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
      }
    }
    
    // Load Facebook SDK
    if (!facebookScriptRef.current) {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v17.0";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
      facebookScriptRef.current = script;
    }
    
    // Load LinkedIn Insight Tag (optional for analytics)
    if (!linkedinScriptRef.current) {
      const script = document.createElement("script");
      script.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
      script.async = true;
      document.body.appendChild(script);
      linkedinScriptRef.current = script;
    }
    
    return () => {
      // Cleanup if component unmounts
    };
  }, []); 

  return (
    <section className="py-8 flex justify-center items-center max-w-[80%] mx-auto">
      <div className="w-full">
        <h2 className="text-3xl font-bold text-center mb-8">Connect With Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 w-full">
          {socialItems.map((item, index) => (
            <div
              key={index}
              className="grid-item bg-white rounded-xl shadow-lg text-center p-4
                transform transition-all duration-300 ease-in-out hover:scale-[1.05] hover:shadow-2xl 
                hover:z-10 relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Twitter Post */}
              {item.type === "twitter-post" && (
                <div className="w-full h-[350px] overflow-auto">
                  <blockquote className="twitter-tweet" data-media-max-width="560">
                    <p lang="en" dir="ltr">
                      Team SLCR (IIT-BHU) participated in Ganga Utsav 2024 showcasing the joint vision of clean rivers. 
                      NMCG organizes Ganga Utsav every year to commemorate the anniversary of the declaration of River Ganga as 'National River'. 
                      <a href="https://t.co/8XaF5A4cfW">pic.twitter.com/8XaF5A4cfW</a>
                    </p>
                    &mdash; Smart Laboratory For Clean Rivers (SLCR - IIT-BHU) (@JalTattva) 
                    <a href={`https://twitter.com/JalTattva/status/1853469371840238068?ref_src=twsrc%5Etfw`}>
                      November 4, 2024
                    </a>
                  </blockquote>
                </div>
              )}
              
              {/* Facebook */}
              {item.type === "facebook" && (
                <div className="w-full h-[300px] overflow-auto">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Facebook className="w-16 h-16 text-blue-600 mb-4 mx-auto" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Follow on Facebook</h3>
                      <p className="text-gray-600 mb-4">Facebook integration will be added manually</p>
                      <a
                        href={`https://www.facebook.com/${item.pageUrl}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Visit Page
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {/* YouTube */}
              {item.type === "youtube" && (
                <div className="w-full h-[300px] flex flex-col">
                  <iframe
                    width="100%"
                    height="200"
                    src={`https://www.youtube.com/embed/${item.videoId}?si=W5cR6eTf5BGki5N8`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                  <div className="mt-2 text-center">
                    <a 
                      href={item.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline mt-2 inline-block"
                    >
                      Read our article on river rejuvenation
                    </a>
                  </div>
                </div>
              )}
              
              {/* LinkedIn */}
              {item.type === "linkedin" && (
                <div className="w-full h-[300px] flex flex-col items-center justify-center">
                  <Linkedin className="w-16 h-16 text-blue-700 mb-4" />
                  <h3 className="font-medium text-gray-800 mb-2">Connect on LinkedIn</h3>
                  <p className="text-sm text-gray-600 mb-4">Follow our professional updates</p>
                  <a 
                    href={`https://${item.profileUrl}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Visit Profile
                  </a>
                  
                  {/* LinkedIn Follow Button - Optional (requires LinkedIn API) */}
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 mt-2">
                      SLCR - Smart Laboratory on Clean Rivers
                    </div>
                  </div>
                </div>
              )}
              
              {/* Instagram */}
              {item.type === "instagram" && (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <a
                    href={`https://www.instagram.com/${item.profileName}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:text-pink-700"
                  >
                    <Instagram className="w-16 h-16 mb-2 mx-auto" />
                    <span className="block font-medium text-gray-800 mb-1">@{item.profileName}</span>
                    <span className="text-sm block mt-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all">
                      View Instagram Feed
                    </span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}