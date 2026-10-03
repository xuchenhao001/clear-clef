import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-[0.9375rem] font-medium whitespace-nowrap edition-interactive-transition outline-none select-none focus-visible:ring-3 focus-visible:ring-edition-focus-ring active:scale-[0.99] disabled:pointer-events-none aria-invalid:border-edition-semantic-error aria-invalid:ring-3 aria-invalid:ring-edition-semantic-error/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-edition-primary text-edition-on-primary hover:opacity-90 disabled:bg-edition-surface-strong disabled:text-edition-muted-soft disabled:opacity-100",
        outline:
          "border-edition-field-border bg-transparent text-edition-ink hover:bg-edition-hover disabled:border-edition-hairline disabled:text-edition-muted-soft disabled:opacity-100",
        secondary:
          "bg-edition-surface-strong text-edition-ink hover:opacity-90 disabled:bg-edition-surface-strong disabled:text-edition-muted-soft disabled:opacity-100",
        ghost:
          "text-edition-ink hover:bg-edition-hover disabled:text-edition-muted-soft disabled:opacity-100",
        destructive:
          "bg-edition-semantic-error/10 text-edition-semantic-error hover:bg-edition-semantic-error/20 disabled:bg-edition-surface-strong disabled:text-edition-muted-soft disabled:opacity-100",
        link: "text-edition-ink underline-offset-4 hover:underline disabled:text-edition-muted-soft disabled:opacity-100",
      },
      size: {
        default: "h-10 gap-1.5 px-5 coarse:min-h-11",
        sm: "h-10 gap-1 px-4 text-sm coarse:min-h-11",
        lg: "h-11 gap-2 px-6",
        icon: "size-10 coarse:min-h-11 coarse:min-w-11",
        "icon-sm": "size-10 coarse:min-h-11 coarse:min-w-11",
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
