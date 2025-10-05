import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    button: { label: "Contact to Upgrade", disabled: true },
    tier: "starter",
  },
  {
    name: "Premium",
    price: "98.99",
    description: "For teams and power users",
    features: ["Everything in Starter","5,000 credits per month","Save up to 100 templates", "Priority support"],
    button: { label: "Contact to Upgrade", disabled: true },
    tier: "premium",
  },
]

export default function Pricing() {
  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
      
      {/* Notice Banner */}
      <Alert className="mb-8 border-blue-200 bg-blue-50">
        <Mail className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-gray-700">
          <strong>All plans are currently available!</strong> Due to payment processing setup, 
          we're temporarily handling upgrades manually. To upgrade to Starter or Premium, 
          please send an email to{" "}
          <a 
            href="mailto:ovuobachiagozie@gmail.com" 
            className="text-blue-600 hover:underline font-medium"
          >
            ovuobachiagozie@gmail.com
          </a>{" "}
          with your preferred plan and we'll get you set up in less than 30 minutes.
        </AlertDescription>
      </Alert>

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
                disabled={plan.button.disabled}
                variant={plan.tier === "free" ? "secondary" : "default"}
              >
                {plan.button.label}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}