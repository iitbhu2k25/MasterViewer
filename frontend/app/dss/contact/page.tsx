'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin, Clock, MessageSquare, HeadphonesIcon, Send, User, AtSign } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [activeTab, setActiveTab] = useState('contact');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: { target: { name: any; value: any; }; }) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    // Here you would normally handle the form submission to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <main className="max-w-[1200px] mx-auto my-16 px-6">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-[#1A75BB] to-[#0c4a7a] py-12 px-8 text-white">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <Image 
              src="/images/contact/pattern.png" 
              alt="Background Pattern"
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-center relative z-10 mb-4">Contact Us</h1>
          <p className="text-center text-gray-100 max-w-2xl mx-auto relative z-10">
            We're here to help and answer any questions you might have. We look forward to hearing from you.
          </p>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mt-10 relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 inline-flex">
              <button
                onClick={() => setActiveTab('contact')} 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === 'contact' ? 'bg-white text-[#1A75BB]' : 'text-white hover:bg-white/20'
                }`}
              >
                Contact Info
              </button>
              <button
                onClick={() => setActiveTab('message')} 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === 'message' ? 'bg-white text-[#1A75BB]' : 'text-white hover:bg-white/20'
                }`}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-8">
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Get in Touch</h2>
                
                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex items-start bg-gray-50 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:bg-white border border-gray-100">
                    <div className="bg-[#1A75BB]/10 p-3 rounded-full text-[#1A75BB] mr-4">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium">Email Us</h3>
                      <p className="text-gray-600 mt-1">coordinator.gtac@itbhu.ac.in</p>
                      <p className="text-gray-600">slcr.varanasi@gmail.com</p>
                    </div>
                  </div>
                  
                  {/* Phone */}
                  <div className="flex items-start bg-gray-50 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:bg-white border border-gray-100">
                    <div className="bg-[#1A75BB]/10 p-3 rounded-full text-[#1A75BB] mr-4">
                      <Phone size={20} />
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium">Call Us</h3>
                      <p className="text-gray-600 mt-1">+91-542-2575389</p>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="flex items-start bg-gray-50 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:bg-white border border-gray-100">
                    <div className="bg-[#1A75BB]/10 p-3 rounded-full text-[#1A75BB] mr-4">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium">Visit Us</h3>
                      <p className="text-gray-600 mt-1">
                        Smart Laboratory for Clean Rivers (SLCR)<br />
                        Department of Civil Engineering,<br />
                        Indian Institute of Technology (BHU)<br />
                        Varanasi 221005
                      </p>
                    </div>
                  </div>
                  
                  {/* Working Hours */}
                  <div className="flex items-start bg-gray-50 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:bg-white border border-gray-100">
                    <div className="bg-[#1A75BB]/10 p-3 rounded-full text-[#1A75BB] mr-4">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-gray-700 font-medium">Working Hours</h3>
                      <p className="text-gray-600 mt-1">Monday - Friday: 9AM - 6PM</p>
                      <p className="text-gray-600">Saturday: 9AM - 1PM</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Map */}
              <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 h-[580px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.218529759872!2d82.99154878507075!3d25.26323320476016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x398e322a6031e99d%3A0x962763bc1a36226!2sDepartment%20of%20Civil%20Engineering%2C%20IIT%20(Banaras%20Hindu%20University)!5e0!3m2!1sen!2sin!4v1739171130935!5m2!1sen!2sin"
                  width="600" 
                  height="1000" 
                  className="w-full h-full border-0"
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          )}
          
          {activeTab === 'message' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Send Us a Message</h2>
                
                {submitted ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="bg-green-100 p-3 rounded-full text-green-500">
                        <Send size={24} />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium">Message Sent Successfully!</h3>
                    <p className="mt-2">Thank you for reaching out. We'll get back to you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <User size={18} />
                          </div>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-gray-700 focus:border-[#1A75BB] focus:outline-none focus:ring-1 focus:ring-[#1A75BB]"
                            placeholder="Enter your name"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <AtSign size={18} />
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="pl-10 w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-gray-700 focus:border-[#1A75BB] focus:outline-none focus:ring-1 focus:ring-[#1A75BB]"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-gray-700 focus:border-[#1A75BB] focus:outline-none focus:ring-1 focus:ring-[#1A75BB]"
                        placeholder="What is this regarding?"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className="w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-gray-700 focus:border-[#1A75BB] focus:outline-none focus:ring-1 focus:ring-[#1A75BB]"
                        placeholder="Tell us how we can help you..."
                        required
                      />
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        className="w-full bg-[#1A75BB] text-white py-3 px-6 rounded-lg hover:bg-[#0c5a97] transition-colors duration-300 flex items-center justify-center font-medium"
                      >
                        <Send size={18} className="mr-2" />
                        Send Message
                      </button>
                    </div>
                  </form>
                )}
              </div>
              
              {/* Support Cards */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Additional Support</h2>
                
                <div className="space-y-4">
                  {/* Live Chat */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white">
                    <div className="flex items-center">
                      <div className="bg-[#1A75BB]/10 p-3 rounded-full text-[#1A75BB] mr-4">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-700 font-medium">Live Chat</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          Available Monday - Friday<br />
                          9AM - 5PM IST
                        </p>
                        <button className="mt-3 bg-[#1A75BB] text-white text-sm py-2 px-4 rounded-lg hover:bg-[#0c5a97] transition-colors duration-300">
                          Start Chat
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Technical Support */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 transition-all duration-300 hover:shadow-md hover:bg-white">
                    <div className="flex items-center">
                      <div className="bg-[#1A75BB]/10 p-3 rounded-full text-[#1A75BB] mr-4">
                        <HeadphonesIcon size={20} />
                      </div>
                      <div>
                        <h3 className="text-gray-700 font-medium">Technical Support</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          24/7 Technical Assistance<br />
                          For urgent technical issues
                        </p>
                        <button className="mt-3 bg-[#1A75BB] text-white text-sm py-2 px-4 rounded-lg hover:bg-[#0c5a97] transition-colors duration-300">
                          Get Support
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* FAQ Card */}
                  <div className="bg-[#1A75BB] text-white rounded-xl p-5 shadow-md">
                    <h3 className="font-medium text-lg mb-2">Frequently Asked Questions</h3>
                    <p className="text-white/80 mb-4 text-sm">
                      Find answers to common questions about our services and research activities.
                    </p>
                    <button className="bg-white text-[#1A75BB] text-sm py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors duration-300 font-medium">
                      View FAQs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}