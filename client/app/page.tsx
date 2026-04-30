import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Welcome to <span className="text-blue-600">ManoMITRA</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Your trusted companion for mental health, wellness, and personal growth. 
          We're here to support your journey towards a healthier, happier life.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/get-started"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition transform hover:scale-105"
          >
            Get Started Now
          </Link>
          <Link
            href="/about"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Why Choose ManoMITRA?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Expert Support",
              description: "Access to licensed professionals and expert guidance for your mental wellness journey.",
              icon: "👨‍⚕️",
            },
            {
              title: "24/7 Availability",
              description: "Get support whenever you need it. Our resources are available around the clock.",
              icon: "🕐",
            },
            {
              title: "Personalized Experience",
              description: "Tailored recommendations and programs designed specifically for your needs.",
              icon: "🎯",
            },
            {
              title: "Privacy & Security",
              description: "Your data is secure and confidential. We respect your privacy completely.",
              icon: "🔒",
            },
            {
              title: "Community Support",
              description: "Connect with others on similar journeys and share experiences in a safe space.",
              icon: "👥",
            },
            {
              title: "Progress Tracking",
              description: "Monitor your wellness journey with detailed insights and progress tracking tools.",
              icon: "📊",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8">Join thousands of people improving their mental health and wellness.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition transform hover:scale-105"
            >
              Sign Up Free
            </Link>
            <Link
              href="/contact"
              className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-800 transition transform hover:scale-105"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">ManoMITRA</h3>
              <p className="text-gray-400">Your companion for mental health and wellness.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                <li><Link href="/about" className="hover:text-white transition">About</Link></li>
                <li><Link href="/get-started" className="hover:text-white transition">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/login" className="hover:text-white transition">Login</Link></li>
                <li><Link href="/signup" className="hover:text-white transition">Sign Up</Link></li>
                <li><a href="#" className="hover:text-white transition">Dashboard</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; 2026 ManoMITRA. All rights reserved. Your mental health matters.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}