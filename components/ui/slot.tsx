"use client";

import * as React from "react";

/**
 * Slot component that merges its props and children with its child element.
 * This is a simplified implementation of the Radix UI Slot pattern.
 */
interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      const childProps = children.props as Record<string, unknown>;

      return React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        {
          ...props,
          ...childProps,
          ref: ref
            ? composeRefs(
                ref,
                (
                  children as React.ReactElement<{
                    ref?: React.Ref<HTMLElement>;
                  }>
                ).props.ref,
              )
            : (children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>)
                .props.ref,
          className: mergeClassNames(
            props.className,
            childProps.className as string | undefined,
          ),
        },
      );
    }

    if (React.Children.count(children) > 1) {
      React.Children.only(null); // This will throw an error
    }

    return null;
  },
);
Slot.displayName = "Slot";

function composeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  };
}

function mergeClassNames(
  ...classNames: (string | undefined)[]
): string | undefined {
  const merged = classNames.filter(Boolean).join(" ");
  return merged || undefined;
}

export { Slot };
