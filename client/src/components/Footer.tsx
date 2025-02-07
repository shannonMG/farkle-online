// src/components/Footer.tsx
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 text-center shadow-md">
      <p>&copy; {new Date().getFullYear()} Farkle Online. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
