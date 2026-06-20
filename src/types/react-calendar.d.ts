declare module "react-calendar" {
  import { ComponentType } from "react";

  export type CalendarValue = Date | [Date | null, Date | null] | null;

  export interface CalendarProps {
    value?: Date | Date[] | null;
    onChange?: (value: CalendarValue, event: React.MouseEvent<HTMLButtonElement>) => void;
    tileClassName?: (args: { date: Date; view: string }) => string | null | undefined;
    tileContent?: (args: { date: Date; view: string }) => React.ReactNode;
    locale?: string;
    [key: string]: unknown;
  }

  export const Calendar: ComponentType<CalendarProps>;
  export default Calendar;
}
