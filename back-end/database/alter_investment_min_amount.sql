-- Set minimum investment amount to ₹5 for "below_5000" plan (run if you already had min_amount 1000).
UPDATE investment_plans SET min_amount = 5.00 WHERE category = 'below_5000' AND min_amount > 5;
