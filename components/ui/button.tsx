import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-[0.9375rem] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-edition-hairline-strong/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-edition-semantic-error aria-invalid:ring-3 aria-invalid:ring-edition-semantic-error/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-edition-primary text-edition-on-primary hover:opacity-90",
        outline:
          "border-edition-hairline-strong bg-transparent text-edition-ink hover:bg-edition-canvas-soft",
        secondary:
          "bg-edition-surface-strong text-edition-ink hover:opacity-90",
        ghost:
          "text-edition-ink hover:bg-edition-canvas-soft",
        destructive:
          "bg-edition-semantic-error/10 text-edition-semantic-error hover:bg-edition-semantic-error/20",
        link: "text-edition-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-1.5 px-5",
        sm: "h-8 gap-1 px-4 text-sm",
        lg: "h-11 gap-2 px-6",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
