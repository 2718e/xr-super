# Overall project goal

Trying to calculate how to balance the tax effiency of using retirement accounts (such as Australia's superannuation) to invest vs the risk of not reaching retirement because of X-risks (i.e. end of world)

# Technical concerns

- should be deployable as a static web application (e.g. on vercel or similar - as well as being able to run locally)

# What variables are relavant

Some things might want to enter and use in calculations

- my age
- retirement age
- x risk (probability per year of world ending)
- existing investments
  - home equity if applicable
  - savings
  - shares outside super (presume internally diversified indexed ETF)

# Possible outputs

How much extra than the minimum I should put into super (if any)
- as % of salary
- as absolute number

# Visualisations

- ability to graph a particular range of values for any particular variable (most notably x-risk on horizontal axis)

# Extensibility

Will probably want to experiment with different calculation methods, so decouple calculation methods from interface (variable entry, graphing)

Decouple storing of variables from interface used to edit them (possibly by state manager)

## Other specs

- sensible defaults for values. Save edited values locally in browser storage

## Tech choices.

Default to more popular, well maintained, relatively modern choices unless a good reason not to.
- I'm guessing, but correct me if wrong, that this probably means react and typescript?
- Vite / vitest (less certain of this)?
- What to use for graphing?

## Interface Question

- how to enter values / enter ranges to graph?