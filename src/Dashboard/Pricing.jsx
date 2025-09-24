import { useState } from "react"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Great for getting started",
    features: ["30 credits for free trial", "Save up to 3 templates", "Email + Chat support"],
    button: { label: "Current Plan", disabled: true },
    tier: "free",
  },
  {
    name: "Starter",
    price: "29.99",
    description: "Perfect for individuals",
    features: ["Everything in Free","1,000 credits per month","Save up to 15 templates", "Email + Chat support"],
    button: { label: "Subscribe $29/mo", disabled: false },
    tier: "starter",
  },
  {
    name: "Premium",
    price: "98.99",
    description: "For teams and power users",
    features: ["Everything in Starter","5,000 credits per month","Save up to 100 templates", "Priority support"],
    button: { label: "Subscribe $99/mo", disabled: false },
    tier: "premium",
  },
]


export default function Pricing() {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (tier) => {
    try {
      setLoading(true)
      const res = await axios.post(
        "http://localhost:5000/app/checkout/create-checkout",
        { plan: tier },
        { withCredentials: true } // 👈 sends cookies/session
      )

      if (res.data?.data.checkoutUrl ) {
        window.location.href = res.data.data.checkoutUrl // redirect to LS checkout
      } else {
        alert("Something went wrong")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to start checkout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Choose Your Plan</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.tier} className="flex flex-col justify-between shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4">
                {plan.price === "0" ? "Free" : `$${plan.price}/mo`}
              </p>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={plan.button.disabled || loading}
                onClick={() => handleSubscribe(plan.tier)}
              >
                {loading ? "Redirecting..." : plan.button.label}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
