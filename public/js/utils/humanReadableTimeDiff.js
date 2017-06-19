// @flow

type DiffFormat = "seconds" | "minutes" | "hours" | "days"

const duration = {
  seconds: 1000,
  minutes: 1000 * 60,
    hours: 1000 * 60 * 60,
     days: 1000 * 60 * 60 * 24,
}

const getDiff = (dateDiff: number, format: DiffFormat) =>
  Math.floor(dateDiff / duration[format])

export default function humanReadableTimeDiff(date: Date): string {
  const dateDiff = Date.now() - date

  if (dateDiff <= 0 || Math.floor(dateDiff / 1000) == 0)
    return 'now'

  if (dateDiff < 1000 * 60)
    return `${getDiff(dateDiff, "seconds")}s`

  if (dateDiff < 1000 * 60 * 60)
    return `${getDiff(dateDiff, "minutes")}m`

  if (dateDiff < 1000 * 60 * 60 * 24)
    return `${getDiff(dateDiff, "hours")}h`

  return `${getDiff(dateDiff, "days")}d`
}
