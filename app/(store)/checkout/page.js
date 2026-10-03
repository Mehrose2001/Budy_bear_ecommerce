"use client";

import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";
import OrderSummary from "@/components/checkout/OrderSummary";
import { CheckoutFields, useCheckoutForm } from "@/components/checkout/CheckoutForm";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { items, subtotal, discount, itemCount } = useCart();
  const checkout = useCheckoutForm({ subtotal, discount });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <h1 className="text-3xl font-black tracking-tight text-neutral-900">
        Checkout
      </h1>
      <p className="mt-3 max-w-2xl text-neutral-600">
        Enter your delivery details and place your Cash on Delivery order.
      </p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-neutral-300 p-10 text-center">
          <p className="font-semibold">Add items before checking out.</p>
          <Button href="/products" className="mt-6">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <CheckoutFields
            form={checkout.form}
            errors={checkout.errors}
            updateField={checkout.updateField}
            handleSubmit={checkout.handleSubmit}
            isSubmitting={checkout.isSubmitting}
            selectedPayment={checkout.selectedPayment}
            couponCode={checkout.couponCode}
            setCouponCode={checkout.setCouponCode}
            coupon={checkout.coupon}
            couponError={checkout.couponError}
            applyCoupon={checkout.applyCoupon}
          />
          <div className="h-fit xl:sticky xl:top-36">
            <OrderSummary
              items={items}
              subtotal={checkout.liveTotals.subtotal}
              discount={checkout.liveTotals.discount}
              productDiscount={checkout.liveTotals.productDiscount}
              couponDiscount={checkout.liveTotals.couponDiscount}
              couponCode={checkout.coupon?.code}
              shipping={checkout.liveTotals.shipping}
              total={checkout.liveTotals.total}
              deliveryMethod={checkout.form.deliveryMethod}
            />
            <p className="mt-3 text-center text-xs text-neutral-500">
              {itemCount} item{itemCount === 1 ? "" : "s"} in this order
            </p>
            <Button
              type="submit"
              form="checkout-form"
              size="lg"
              className="mt-4 w-full xl:hidden"
              disabled={checkout.isSubmitting}
            >
              {checkout.isSubmitting
                ? "Placing order..."
                : checkout.selectedPayment?.id === "cod"
                  ? "Place COD order"
                  : "Place order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
