# Goal for this step

Cleanup and fixes for the initial draft

## Code Quality

In fields.ts, don't specify on the NUMERIC_FIELDS whether or not it's used in model B.

Is there really any need to explicitly keep track of whether or not a particular field is used in the model at all?

## Interface

Should be some padding or spacing between current salary and Marginal tax rate selector.

the Y axis "% of salary" label in reccomented extra super displays wrong. The labels say "%" but the number is actually a the decimal (e.g. the label says 0.2% instead of 20%) 

## Calculations

Shouldn't use the 50% CGT discount as this is being phased out. Calculations should be based on the newer changes to CGT - these being
- minimum 30% tax on gains at time of realisation.
- cost base will be inflation adjusted.

## Out of scope

The following isn't part of this step:

- Creating more calculation models.

- Adding the cost base of equity investments or home value to the model. For now just guess the cost base is 60% of the total (at the current time).
