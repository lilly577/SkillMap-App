import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-100 text-gray-900 mt-10 py-6 border-t border-gray-300">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-6">
        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-medium">
          <Link to="/contact" className="hover:text-blue-600">
            Contact Us
          </Link>
          <Link to="/help" className="hover:text-blue-600">
            Help
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-gray-800 mt-4">
        © {new Date().getFullYear()} SkillMap. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
