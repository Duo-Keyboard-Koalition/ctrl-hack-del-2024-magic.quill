// Navbar.js
import React from 'react';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center">
          <Image src="/Logo.png" alt="Logo" width={128} height={64*2} />
          {/* <span className="text-white font-semibold text-xl">magic.quill</span> */}
        </div>
      </div>
    </nav>
  )
}