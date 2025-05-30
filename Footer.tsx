import { Link } from "wouter";
import { Paintbrush } from "lucide-react";
import { 
  FaInstagram, 
  FaFacebook, 
  FaTwitter, 
  FaPinterest 
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-dark text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Paintbrush className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-poppins">ColorCompete</span>
            </div>
            <p className="text-gray-400 mb-4">Join our community of artists, showcase your coloring skills, and win amazing prizes!</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <FaInstagram className="text-xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <FaFacebook className="text-xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <FaTwitter className="text-xl" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <FaPinterest className="text-xl" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-poppins font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white transition">Home</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition">About Us</Link></li>
              <li><Link href="/contests" className="text-gray-400 hover:text-white transition">Current Contests</Link></li>
              <li><Link href="/gallery" className="text-gray-400 hover:text-white transition">Winners Gallery</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-white transition">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-poppins font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/tutorials" className="text-gray-400 hover:text-white transition">Coloring Tutorials</Link></li>
              <li><Link href="/spotlights" className="text-gray-400 hover:text-white transition">Artist Spotlights</Link></li>
              <li><Link href="/guidelines" className="text-gray-400 hover:text-white transition">Community Guidelines</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white transition">FAQs</Link></li>
              <li><Link href="/support" className="text-gray-400 hover:text-white transition">Contact Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-poppins font-semibold text-lg mb-4">Stay Updated</h4>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter for contest updates and coloring tips.</p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <Input 
                type="email" 
                className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary border-gray-800" 
                placeholder="Your email address" 
              />
              <Button 
                type="submit" 
                className="w-full bg-primary text-white rounded-lg py-2 hover:bg-primary/90 transition"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">&copy; {new Date().getFullYear()} ColorCompete. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition text-sm">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition text-sm">Terms of Service</Link>
            <Link href="/cookies" className="text-gray-400 hover:text-white transition text-sm">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
