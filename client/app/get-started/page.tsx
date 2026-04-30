import Link from "next/link";

export default function GetStarted() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Get Started with ManoMITRA</h1>
          <p className="text-xl text-gray-600">Your journey to better mental health begins here</p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            {
              step: 1,
              title: "Create Account",
              description: "Sign up with your email to get started",
              icon: "📝",
            },
            {
              step: 2,
              title: "Assessment",
              description: "Take a quick wellness assessment",
              icon: "📋",
            },
            {
              step: 3,
              title: "Personalize",
              description: "Customize your wellness journey",
              icon: "⚙️",
            },
            {
              step: 4,
              title: "Start Healing",
              description: "Begin your transformation today",
              icon: "🌟",
            },
          ].map((item, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition transform hover:scale-105">
              <div className="inline-block bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                {item.step}
              </div>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">What You'll Get Access To</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Mental Health Resources",
                items: [
                  "Expert articles and guides",
                  "Video tutorials and workshops",
                  "Meditation and mindfulness exercises",
                  "Sleep wellness programs",
                ],
              },
              {
                title: "Professional Support",
                items: [
                  "Connect with licensed therapists",
                  "Counseling sessions available",
                  "Psychiatry consultations",
                  "Crisis support helpline",
                ],
              },
              {
                title: "Community Features",
                items: [
                  "Support groups and forums",
                  "Peer discussions",
                  "Success stories and inspirations",
                  "Community events and webinars",
                ],
              },
              {
                title: "Tracking & Progress",
                items: [
                  "Mood and wellness tracking",
                  "Progress reports and insights",
                  "Personal journal space",
                  "Goal setting and achievement",
                ],
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{feature.title}</h3>
                <ul className="space-y-4">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <span className="text-green-600 text-2xl mr-3">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Free",
                price: "$0",
                features: [
                  "Access to basic resources",
                  "Community forum access",
                  "Limited journal entries",
                  "Email support",
                ],
              },
              {
                name: "Professional",
                price: "$29",
                period: "/month",
                features: [
                  "All Free features",
                  "Expert counseling sessions",
                  "Weekly therapy support",
                  "Unlimited journal entries",
                  "Priority support",
                ],
                popular: true,
              },
              {
                name: "Premium",
                price: "$59",
                period: "/month",
                features: [
                  "All Professional features",
                  "Psychiatry consultations",
                  "Daily support sessions",
                  "Personalized wellness plan",
                  "24/7 crisis support",
                ],
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`rounded-lg shadow-md overflow-hidden transition transform hover:scale-105 ${
                  plan.popular ? "bg-blue-600 text-white ring-2 ring-blue-600 md:scale-105" : "bg-white"
                }`}
              >
                <div className="p-8">
                  {plan.popular && <span className="bg-yellow-400 text-blue-600 px-4 py-1 rounded-full text-sm font-bold">Popular</span>}
                  <h3 className={`text-2xl font-bold mb-2 ${!plan.popular && "text-gray-900"}`}>{plan.name}</h3>
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${!plan.popular && "text-gray-900"}`}>{plan.price}</span>
                    {plan.period && <span className={plan.popular ? "text-blue-100" : "text-gray-600"}>{plan.period}</span>}
                  </div>
                  <button
                    className={`w-full py-2 px-4 rounded-lg font-bold mb-6 transition transform hover:scale-105 ${
                      plan.popular
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Get Started
                  </button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <span className="mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-blue-600 text-white p-12 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Life?</h2>
          <p className="text-xl mb-8">Start your free trial today. No credit card required. Cancel anytime.</p>
          <Link
            href="/signup"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition transform hover:scale-105"
          >
            Start Free Trial
          </Link>
        </section>
      </div>
    </main>
  );
}