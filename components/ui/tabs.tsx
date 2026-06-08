"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-start gap-1 border-b border-border bg-transparent w-full overflow-x-auto",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    badge?: number;
    hasUnread?: boolean;
  }
>(({ className, badge, hasUnread, ...props }, ref) => {
  const t = useTranslations("common");
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition-all",
        "hover:text-text-primary hover:bg-surface-2",
        "data-[state=active]:bg-surface-2 data-[state=active]:text-text-primary data-[state=active]:shadow-sm",
        "disabled:pointer-events-none disabled:opacity-50",
        "outline-none focus-visible:ring-2 focus-visible:ring-text-primary/30",
        className
      )}
      {...props}
    >
      {props.children}
      {badge !== undefined && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-text-primary px-1.5 text-xs font-semibold text-surface">
          {badge}
        </span>
      )}
      {hasUnread && badge === undefined && (
        <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-positive">
          <span className="sr-only">{t("hasUnread")}</span>
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-6 outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
