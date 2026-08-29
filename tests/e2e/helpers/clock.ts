export async function useClock(
  page: import('@playwright/test').Page,
  now: string,
) {
  await page.addInitScript((timestamp) => {
    const NativeDate = Date;

    class ControlledDate extends NativeDate {
      constructor(...args: [] | [string | number]) {
        if (args.length === 0) {
          super(timestamp);
          return;
        }

        super(args[0]);
      }

      static now() {
        return timestamp;
      }
    }

    window.Date = ControlledDate as DateConstructor;
  }, new Date(now).getTime());
}
