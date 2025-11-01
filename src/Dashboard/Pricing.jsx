import { motion } from "motion/react";
import { Mail } from "lucide-react";
import { useEffect } from "react";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Great for getting started",
    features: [
      "30 credits for free trial",
      "Save up to 3 templates",
      "Basic image generation",
      "Community support",
      "API access",
    ],
    tier: "free",
    cta: "Current Plan",
    popular: false,
  },
  {
    name: "Starter",
    price: "29.99",
    description: "Perfect for individuals and small projects",
    features: [
      "Everything in Free",
      "1,000 credits per month",
      "Save up to 15 templates",
      "Email + Chat support",
    ],
    tier: "starter",
    cta: "Contact to Upgrade",
    popular: true,
  },
  {
    name: "Premium",
    price: "98.99",
    description: "For teams and power users",
    features: [
      "Everything in Starter",
      "5,000 credits per month",
      "Save up to 100 templates",
      "Priority support",
    ],
    tier: "premium",
    cta: "Contact to Upgrade",
    popular: false,
  },
];

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-green-500 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function Pricing() {
  // 👇 Initialize Tawk if not already loaded
  useEffect(() => {
    if (!window.Tawk_API) return;
    window.Tawk_API.onLoad = () => console.log("Tawk.to loaded");
  }, []);

  // 👇 Opens chat widget when upgrade button is clicked
  const openChat = () => {
    if (window.Tawk_API) {
      window.Tawk_API.maximize(); // Opens chat widget
    } else {
      alert("Chat is not available right now. Please refresh or email chiagozie@rendria.com.");
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upgrade instantly via chat — our team will activate your plan in minutes.
          </p>
        </motion.div>

        {/* Notice Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4 items-start">
            <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm text-gray-700 leading-relaxed">
              <strong className="font-semibold">All plans are currently available!</strong>{" "}
              We’re handling upgrades manually for now. You can either start a{" "}
              <button
                onClick={openChat}
                className="text-blue-600 hover:underline font-medium"
              >
                live chat
              </button>{" "}
              or email{" "}
              <a
                href="mailto:chiagozie@rendria.com"
                className="text-blue-600 hover:underline font-medium"
              >
                chiagozie@rendria.com
              </a>{" "}
              to upgrade your plan.
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div
                className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full flex flex-col ${
                  plan.popular
                    ? "border-2 border-orange-500 scale-105"
                    : "border border-gray-200"
                }`}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    {plan.price !== "0" && (
                      <span className="text-gray-600 ml-2">/month</span>
                    )}
                  </div>
                  {plan.price === "0" && (
                    <span className="text-gray-600 text-sm">Forever free</span>
                  )}
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.tier === "free"
                      ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                      : plan.popular
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:scale-105"
                      : "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg"
                  }`}
                  onClick={
                    plan.tier === "free" ? undefined : () => openChat()
                  }
                  disabled={plan.tier === "free"}
                >
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
