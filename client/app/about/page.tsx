export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">About ManoMITRA</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Understanding, supporting, and empowering your mental health journey
          </p>
        </div>

        {/* Mission Section */}
        <section className="bg-white rounded-lg p-12 shadow-md mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            At ManoMITRA, our mission is to make mental health support accessible, affordable, 
            and stigma-free for everyone. We believe that mental wellness is as important as 
            physical health, and everyone deserves professional, compassionate care.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We're committed to providing evidence-based resources, connecting people with qualified 
            professionals, and fostering a supportive community where individuals can thrive.
          </p>
        </section>

        {/* Vision Section */}
        <section className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-600 text-white p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-lg leading-relaxed">
              We envision a world where mental health is prioritized, understood, and supported 
              by everyone. Where seeking help is normal, and where everyone has access to the 
              resources they need to live fulfilling lives.
            </p>
          </div>
          <div className="bg-green-600 text-white p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Our Values</h3>
            <ul className="text-lg space-y-2">
              <li>✓ Compassion - We care deeply about your wellbeing</li>
              <li>✓ Integrity - We're honest and transparent</li>
              <li>✓ Innovation - We continuously improve our services</li>
              <li>✓ Inclusion - Everyone deserves support</li>
              <li>✓ Excellence - We maintain the highest standards</li>
            </ul>
          </div>
        </section>

        {/* Story Section */}
        <section className="bg-white rounded-lg p-12 shadow-md mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            ManoMITRA was founded with a simple belief: mental health support should be available 
            to everyone, regardless of their background or circumstances. Our founder's personal 
            journey with mental health challenges inspired us to create a platform that combines 
            professional expertise with community support.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Today, we're proud to serve thousands of individuals and families, providing them with 
            the tools, resources, and support they need to navigate life's challenges and build 
            stronger, healthier lives.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            ManoMITRA means "mind-friend" in Sanskrit - and that's exactly what we aim to be: 
            your trusted friend and guide on your mental health journey.
          </p>
        </section>

        {/* Team Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Dr. Priya Sharma", role: "Founder & Lead Psychologist", icon: "👩‍⚕️" },
              { name: "Arjun Mehta", role: "Technical Director", icon: "👨‍💻" },
              { name: "Dr. Aisha Patel", role: "Clinical Advisor", icon: "👩‍⚕️" },
            ].map((member, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition">
                <div className="text-5xl mb-4">{member.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-blue-600 text-white py-12 rounded-lg text-center">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <p className="text-lg">Active Users</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <p className="text-lg">Expert Professionals</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <p className="text-lg">Lives Touched</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <p className="text-lg">Support Available</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}