'use client'

import { useRouter } from 'next/navigation'

type Props = {
  slug: string
  hasPatternUnlock: boolean
  hasFullUnlock: boolean
}

type UnlockTier = 'pattern' | 'full'

type RazorpayOrderResponse = {
  key: string
  orderId: string
  amount: number
  currency: string
  unlockTier: UnlockTier
  alreadyUnlocked?: boolean
}

type RazorpayPaymentResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayPaymentResponse) => void
  theme: {
    color: string
  }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void
    }
  }
}

function loadRazorpayCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function ResultCtaButton({
  slug,
  hasPatternUnlock,
  hasFullUnlock,
}: Props) {
  const router = useRouter()

  async function handleUnlock() {
    const unlockTier: UnlockTier = hasPatternUnlock ? 'full' : 'pattern'

    const isLoaded = await loadRazorpayCheckout()

    if (!isLoaded || !window.Razorpay) {
      return
    }

    const response = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug,
        unlockTier,
      }),
    })

    const order = (await response.json()) as RazorpayOrderResponse

    if (!response.ok) {
      return
    }

    if (order.alreadyUnlocked) {
      if (unlockTier === 'full') {
        router.push(`/result/${slug}/analytics`)
        return
    }

      router.refresh()
      return
}

    const razorpay = new window.Razorpay({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'Identity Mirror',
      description:
        unlockTier === 'pattern'
          ? 'Unlock Social Pattern'
          : 'Unlock Identity Map',
      order_id: order.orderId,
      handler: async (paymentResponse) => {
        const verifyResponse = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug,
            unlockTier,
            razorpayPaymentId: paymentResponse.razorpay_payment_id,
            razorpayOrderId: paymentResponse.razorpay_order_id,
            razorpaySignature: paymentResponse.razorpay_signature,
          }),
        })

        if (verifyResponse.ok) {
          if (unlockTier === 'full') {
            router.push(`/result/${slug}/analytics`)
            return
        }

        router.refresh()
    }
      },
      theme: {
        color: '#a3e635',
      },
    })

    razorpay.open()
  }

  if (hasFullUnlock) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleUnlock}
      className="block w-full rounded-full bg-lime-400 px-6 py-5 text-center text-lg font-medium text-black"
    >
      {hasPatternUnlock ? 'Complete My Identity Map · ₹99' : 'Show Me · ₹19'}
    </button>
  )
}