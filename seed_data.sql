-- SEED DATA SQL
DO $$
DECLARE
  target_user_id UUID := 'c8f8dd02-eaa6-4427-a3f8-4c8f69ac4fb0'; -- waiyanmyintaung37@gmail.com
  account_uuid UUID;
  trade_uuid UUID;
BEGIN
  -- Create Account
  INSERT INTO accounts (user_id, name, propfirm, account_size, account_type, initial_balance, current_balance, asset, created_at)
  VALUES (target_user_id, 'YRM23187', 'MyFundedFutures', '50K', 'Funded', 50000, 50000, 'MNQ', NOW())
  ON CONFLICT DO NOTHING RETURNING id INTO account_uuid;

  IF account_uuid IS NULL THEN
    SELECT id INTO account_uuid FROM accounts WHERE name = 'YRM23187' AND user_id = target_user_id LIMIT 1;
  END IF;

  -- Trade: MNQ LONG on 2026-02-24 14:40:16
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-02-24 14:40:16+00', 
    '2026-02-24 14:44:52+00', 1, 24823.5, 
    24903.5, 158.4, 'CLOSED', '2026-02-24 14:40:16+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24903.5, 'TP', '2026-02-24 14:44:52+00');

  -- Trade: MNQ SHORT on 2026-02-25 15:57:33
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-02-25 15:57:33+00', 
    '2026-02-25 15:59:12+00', 1, 25276.25, 
    25294.75, -38.6, 'CLOSED', '2026-02-25 15:57:33+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25294.75, 'TP', '2026-02-25 15:59:12+00');

  -- Trade: MNQ LONG on 2026-02-25 16:08:29
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-02-25 16:08:29+00', 
    '2026-02-25 16:17:11+00', 1, 25300.5, 
    25282.5, -37.6, 'CLOSED', '2026-02-25 16:08:29+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25282.5, 'TP', '2026-02-25 16:17:11+00');

  -- Trade: MNQ SHORT on 2026-02-26 14:59:40
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-02-26 14:59:40+00', 
    '2026-02-26 15:12:49+00', 1, 25204.75, 
    25089.25, 229.4, 'CLOSED', '2026-02-26 14:59:40+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25089.25, 'TP', '2026-02-26 15:12:49+00');

  -- Trade: MNQ SHORT on 2026-02-27 14:44:28
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-02-27 14:44:28+00', 
    '2026-02-27 14:46:13+00', 2, 24840.75, 
    24876.75, -147.2, 'CLOSED', '2026-02-27 14:44:28+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 24876.75, 'TP', '2026-02-27 14:46:13+00');

  -- Trade: MNQ LONG on 2026-02-27 14:50:19
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-02-27 14:50:19+00', 
    '2026-02-27 14:55:34+00', 1, 24916.25, 
    24867, -100.1, 'CLOSED', '2026-02-27 14:50:19+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24867, 'TP', '2026-02-27 14:55:34+00');

  -- Trade: MNQ SHORT on 2026-03-02 16:31:27
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-02 16:31:27+00', 
    '2026-03-02 16:35:56+00', 1, 24867.75, 
    24913, -92.1, 'CLOSED', '2026-03-02 16:31:27+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24913, 'TP', '2026-03-02 16:35:56+00');

  -- Trade: MNQ SHORT on 2026-03-03 14:50:51
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-03 14:50:51+00', 
    '2026-03-03 15:00:07+00', 1, 24533.25, 
    24530.25, 4.4, 'CLOSED', '2026-03-03 14:50:51+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24530.25, 'TP', '2026-03-03 15:00:07+00');

  -- Trade: MNQ SHORT on 2026-03-03 15:30:03
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-03 15:30:03+00', 
    '2026-03-03 15:31:39+00', 1, 24385.25, 
    24428.5, -88.1, 'CLOSED', '2026-03-03 15:30:03+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24428.5, 'TP', '2026-03-03 15:31:39+00');

  -- Trade: MNQ LONG on 2026-03-03 15:37:46
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-03 15:37:46+00', 
    '2026-03-03 15:49:15+00', 1, 24441, 
    24396.25, -91.1, 'CLOSED', '2026-03-03 15:37:46+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24396.25, 'TP', '2026-03-03 15:49:15+00');

  -- Trade: MNQ SHORT on 2026-03-03 16:03:25
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-03 16:03:25+00', 
    '2026-03-03 16:04:24+00', 1, 24472.75, 
    24513.25, -82.6, 'CLOSED', '2026-03-03 16:03:25+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24513.25, 'TP', '2026-03-03 16:04:24+00');

  -- Trade: MNQ LONG on 2026-03-03 16:08:47
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-03 16:08:47+00', 
    '2026-03-03 16:19:25+00', 1, 24573.25, 
    24582.5, 16.9, 'CLOSED', '2026-03-03 16:08:47+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24582.5, 'TP', '2026-03-03 16:19:25+00');

  -- Trade: MNQ LONG on 2026-03-04 15:01:18
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-04 15:01:18+00', 
    '2026-03-04 15:03:26+00', 1, 24981.75, 
    24916, -133.1, 'CLOSED', '2026-03-04 15:01:18+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24916, 'TP', '2026-03-04 15:03:26+00');

  -- Trade: MNQ LONG on 2026-03-04 15:14:31
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-04 15:14:31+00', 
    '2026-03-04 15:26:20+00', 1, 24959.25, 
    25103.5, 286.9, 'CLOSED', '2026-03-04 15:14:31+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25103.5, 'TP', '2026-03-04 15:26:20+00');

  -- Trade: MNQ LONG on 2026-03-05 14:49:38
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-05 14:49:38+00', 
    '2026-03-05 15:08:06+00', 1, 25099.25, 
    25133.5, 66.9, 'CLOSED', '2026-03-05 14:49:38+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25133.5, 'TP', '2026-03-05 15:08:06+00');

  -- Trade: MNQ LONG on 2026-03-06 15:09:11
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-06 15:09:11+00', 
    '2026-03-06 15:40:13+00', 1, 24687.75, 
    24863.25, 349.4, 'CLOSED', '2026-03-06 15:09:11+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24863.25, 'TP', '2026-03-06 15:40:13+00');

  -- Trade: MNQ SHORT on 2026-03-09 14:19:03
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-09 14:19:03+00', 
    '2026-03-09 14:22:21+00', 1, 24405, 
    24396.25, 15.9, 'CLOSED', '2026-03-09 14:19:03+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24396.25, 'TP', '2026-03-09 14:22:21+00');

  -- Trade: MNQ SHORT on 2026-03-10 14:12:11
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-10 14:12:11+00', 
    '2026-03-10 14:21:07+00', 1, 24931.5, 
    24973.25, -85.1, 'CLOSED', '2026-03-10 14:12:11+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24973.25, 'TP', '2026-03-10 14:21:07+00');

  -- Trade: MNQ LONG on 2026-03-10 14:27:07
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-10 14:27:07+00', 
    '2026-03-10 14:31:44+00', 1, 25009.75, 
    25012.25, 3.4, 'CLOSED', '2026-03-10 14:27:07+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25012.25, 'TP', '2026-03-10 14:31:44+00');

  -- Trade: MNQ LONG on 2026-03-10 14:31:58
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-10 14:31:58+00', 
    '2026-03-10 14:58:04+00', 1, 25018.5, 
    25146.75, 254.9, 'CLOSED', '2026-03-10 14:31:58+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25146.75, 'TP', '2026-03-10 14:58:04+00');

  -- Trade: MNQ SHORT on 2026-03-11 14:58:02
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-11 14:58:02+00', 
    '2026-03-11 14:59:55+00', 1, 25065.5, 
    25064.25, 0.8999999999999999, 'CLOSED', '2026-03-11 14:58:02+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25064.25, 'TP', '2026-03-11 14:59:55+00');

  -- Trade: MNQ SHORT on 2026-03-12 14:03:12
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-12 14:03:12+00', 
    '2026-03-12 14:11:54+00', 1, 24729.25, 
    24726.25, 4.4, 'CLOSED', '2026-03-12 14:03:12+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24726.25, 'TP', '2026-03-12 14:11:54+00');

  -- Trade: MNQ SHORT on 2026-03-13 14:09:20
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-13 14:09:20+00', 
    '2026-03-13 14:20:04+00', 1, 24703.5, 
    24674.25, 56.9, 'CLOSED', '2026-03-13 14:09:20+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24674.25, 'TP', '2026-03-13 14:20:04+00');

  -- Trade: MNQ LONG on 2026-03-16 13:59:21
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-16 13:59:21+00', 
    '2026-03-16 14:12:38+00', 2, 24724.5, 
    24725.75, 1.7999999999999998, 'CLOSED', '2026-03-16 13:59:21+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 24725.75, 'TP', '2026-03-16 14:12:38+00');

  -- Trade: MNQ SHORT on 2026-03-16 14:35:13
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-16 14:35:13+00', 
    '2026-03-16 14:54:50+00', 2, 24679.5, 
    24677.5, 52.8, 'CLOSED', '2026-03-16 14:35:13+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24653.5, 'TP', '2026-03-16 14:49:28+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24677.5, 'TP', '2026-03-16 14:54:50+00');

  -- Trade: MNQ SHORT on 2026-03-17 14:04:25
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-17 14:04:25+00', 
    '2026-03-17 14:19:58+00', 2, 25069.75, 
    25051.25, 107.30000000000001, 'CLOSED', '2026-03-17 14:04:25+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25033, 'TP', '2026-03-17 14:14:56+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25051.25, 'TP', '2026-03-17 14:19:58+00');

  -- Trade: MNQ LONG on 2026-03-18 13:48:29
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-18 13:48:29+00', 
    '2026-03-18 13:51:46+00', 2, 24977.25, 
    24940.5, -150.2, 'CLOSED', '2026-03-18 13:48:29+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 24940.5, 'TP', '2026-03-18 13:51:46+00');

  -- Trade: MNQ SHORT on 2026-03-18 13:58:22
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-18 13:58:22+00', 
    '2026-03-18 14:04:01+00', 1, 24948, 
    24946, 2.4, 'CLOSED', '2026-03-18 13:58:22+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24946, 'TP', '2026-03-18 14:04:01+00');

  -- Trade: MNQ LONG on 2026-03-18 15:14:33
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-18 15:14:33+00', 
    '2026-03-18 15:20:50+00', 1, 24909.25, 
    24874.25, -71.6, 'CLOSED', '2026-03-18 15:14:33+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24874.25, 'TP', '2026-03-18 15:20:50+00');

  -- Trade: MNQ LONG on 2026-03-19 14:13:19
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-19 14:13:19+00', 
    '2026-03-19 14:14:13+00', 1, 24527.25, 
    24492.5, -71.1, 'CLOSED', '2026-03-19 14:13:19+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24492.5, 'TP', '2026-03-19 14:14:13+00');

  -- Trade: MNQ SHORT on 2026-03-19 14:19:41
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-19 14:19:41+00', 
    '2026-03-19 14:32:01+00', 1, 24475.5, 
    24472.5, 4.4, 'CLOSED', '2026-03-19 14:19:41+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24472.5, 'TP', '2026-03-19 14:32:01+00');

  -- Trade: MNQ SHORT on 2026-03-20 14:09:50
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-20 14:09:50+00', 
    '2026-03-20 14:10:08+00', 1, 24293, 
    24310, -35.6, 'CLOSED', '2026-03-20 14:09:50+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24310, 'TP', '2026-03-20 14:10:08+00');

  -- Trade: MNQ SHORT on 2026-03-24 13:52:58
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-24 13:52:58+00', 
    '2026-03-24 14:00:08+00', 1, 24181.75, 
    24230.5, -99.1, 'CLOSED', '2026-03-24 13:52:58+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24230.5, 'TP', '2026-03-24 14:00:08+00');

  -- Trade: MNQ LONG on 2026-03-24 15:17:41
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-03-24 15:17:41+00', 
    '2026-03-24 15:28:32+00', 1, 24320, 
    24348, 54.4, 'CLOSED', '2026-03-24 15:17:41+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24348, 'TP', '2026-03-24 15:28:32+00');

  -- Trade: MNQ SHORT on 2026-03-25 13:55:23
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-25 13:55:23+00', 
    '2026-03-25 14:01:45+00', 2, 24385.25, 
    24381.75, 10.8, 'CLOSED', '2026-03-25 13:55:23+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 24381.75, 'TP', '2026-03-25 14:01:45+00');

  -- Trade: MNQ SHORT on 2026-03-31 14:38:06
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-03-31 14:38:06+00', 
    '2026-03-31 15:00:20+00', 2, 23532, 
    23417.75, 306.8, 'CLOSED', '2026-03-31 14:38:06+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 23491.25, 'TP', '2026-03-31 14:44:59+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 23417.75, 'TP', '2026-03-31 15:00:20+00');

  -- Trade: MNQ SHORT on 2026-04-01 14:38:27
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-01 14:38:27+00', 
    '2026-04-01 14:39:19+00', 3, 24176.75, 
    24199.75, -142.8, 'CLOSED', '2026-04-01 14:38:27+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 3, 24199.75, 'TP', '2026-04-01 14:39:19+00');

  -- Trade: MNQ LONG on 2026-04-01 14:52:27
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-01 14:52:27+00', 
    '2026-04-01 15:21:58+00', 1, 24243.5, 
    24265.25, 41.9, 'CLOSED', '2026-04-01 14:52:27+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 24265.25, 'TP', '2026-04-01 15:21:58+00');

  -- Trade: MNQ SHORT on 2026-04-02 13:41:39
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-02 13:41:39+00', 
    '2026-04-02 13:45:17+00', 2, 23720, 
    23719, 0.7999999999999998, 'CLOSED', '2026-04-02 13:41:39+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 23719, 'TP', '2026-04-02 13:45:17+00');

  -- Trade: MNQ LONG on 2026-04-02 14:10:08
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-02 14:10:08+00', 
    '2026-04-02 14:22:54+00', 2, 23917.5, 
    23985.25, 293.8, 'CLOSED', '2026-04-02 14:10:08+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 23998.25, 'TP', '2026-04-02 14:21:54+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 23985.25, 'TP', '2026-04-02 14:22:54+00');

  -- Trade: MNQ SHORT on 2026-04-06 14:09:34
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-06 14:09:34+00', 
    '2026-04-06 14:11:22+00', 2, 24312.75, 
    24307.75, 16.8, 'CLOSED', '2026-04-06 14:09:34+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 24307.75, 'TP', '2026-04-06 14:11:22+00');

  -- Trade: MNQ LONG on 2026-04-06 14:18:11
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-06 14:18:11+00', 
    '2026-04-06 14:25:55+00', 2, 24348.75, 
    24351.25, 6.8, 'CLOSED', '2026-04-06 14:18:11+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 24351.25, 'TP', '2026-04-06 14:25:55+00');

  -- Trade: MNQ SHORT on 2026-04-08 13:43:25
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-08 13:43:25+00', 
    '2026-04-08 13:43:45+00', 3, 25109.25, 
    25107.25, 7.199999999999999, 'CLOSED', '2026-04-08 13:43:25+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 3, 25107.25, 'TP', '2026-04-08 13:43:45+00');

  -- Trade: MNQ SHORT on 2026-04-09 14:10:30
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-09 14:10:30+00', 
    '2026-04-09 14:12:11+00', 1, 25023.25, 
    25022, 0.8999999999999999, 'CLOSED', '2026-04-09 14:10:30+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25022, 'TP', '2026-04-09 14:12:11+00');

  -- Trade: MNQ LONG on 2026-04-09 15:20:26
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-09 15:20:26+00', 
    '2026-04-09 15:27:03+00', 2, 25092, 
    25068.75, -96.2, 'CLOSED', '2026-04-09 15:20:26+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 25068.75, 'TP', '2026-04-09 15:27:03+00');

  -- Trade: MNQ LONG on 2026-04-09 15:30:11
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-09 15:30:11+00', 
    '2026-04-09 15:38:17+00', 2, 25051.75, 
    25097, 198.8, 'CLOSED', '2026-04-09 15:30:11+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25107.5, 'TP', '2026-04-09 15:32:47+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25097, 'TP', '2026-04-09 15:38:17+00');

  -- Trade: MNQ SHORT on 2026-04-10 13:52:02
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-10 13:52:02+00', 
    '2026-04-10 14:13:16+00', 3, 25323.5, 
    25313.25, 110.7, 'CLOSED', '2026-04-10 13:52:02+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25286.25, 'TP', '2026-04-10 14:10:18+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 25313.25, 'TP', '2026-04-10 14:13:16+00');

  -- Trade: MNQ LONG on 2026-04-10 14:35:08
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-10 14:35:08+00', 
    '2026-04-10 14:39:40+00', 2, 25349.25, 
    25351, 3.8, 'CLOSED', '2026-04-10 14:35:08+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 25351, 'TP', '2026-04-10 14:39:40+00');

  -- Trade: MNQ SHORT on 2026-04-13 13:46:23
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-13 13:46:23+00', 
    '2026-04-13 13:48:16+00', 3, 25186, 
    25183, 13.2, 'CLOSED', '2026-04-13 13:46:23+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 3, 25183, 'TP', '2026-04-13 13:48:16+00');

  -- Trade: MNQ LONG on 2026-04-13 13:51:39
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-13 13:51:39+00', 
    '2026-04-13 14:13:32+00', 2, 25250.5, 
    25281, 154.3, 'CLOSED', '2026-04-13 13:51:39+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25298.75, 'TP', '2026-04-13 13:59:44+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25281, 'TP', '2026-04-13 14:13:32+00');

  -- Trade: MNQ LONG on 2026-04-14 14:18:24
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-14 14:18:24+00', 
    '2026-04-14 14:40:45+00', 3, 25766, 
    25780, 97.69999999999999, 'CLOSED', '2026-04-14 14:18:24+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 25789.25, 'TP', '2026-04-14 14:39:23+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 25780, 'TP', '2026-04-14 14:40:45+00');

  -- Trade: MNQ SHORT on 2026-04-14 15:11:25
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-14 15:11:25+00', 
    '2026-04-14 15:16:54+00', 2, 25785.25, 
    25797.25, -51.2, 'CLOSED', '2026-04-14 15:11:25+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 25797.25, 'TP', '2026-04-14 15:16:54+00');

  -- Trade: MES LONG on 2026-04-15 14:39:03
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MES', 'LONG', '2026-04-15 14:39:03+00', 
    '2026-04-15 15:00:42+00', 1, 7024, 
    7027.5, 15.9, 'CLOSED', '2026-04-15 14:39:03+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 7027.5, 'TP', '2026-04-15 15:00:42+00');

  -- Trade: MNQ SHORT on 2026-04-15 15:36:05
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-15 15:36:05+00', 
    '2026-04-15 15:37:29+00', 2, 26182.75, 
    26181.5, 1.7999999999999998, 'CLOSED', '2026-04-15 15:36:05+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 26181.5, 'TP', '2026-04-15 15:37:29+00');

  -- Trade: MNQ LONG on 2026-04-15 15:56:03
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-15 15:56:03+00', 
    '2026-04-15 16:00:00+00', 1, 26194, 
    26195, 0.3999999999999999, 'CLOSED', '2026-04-15 15:56:03+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 26195, 'TP', '2026-04-15 16:00:00+00');

  -- Trade: MNQ SHORT on 2026-04-16 14:06:26
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-16 14:06:26+00', 
    '2026-04-16 14:12:32+00', 2, 26340, 
    26365.75, -106.2, 'CLOSED', '2026-04-16 14:06:26+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 26365.75, 'TP', '2026-04-16 14:12:32+00');

  -- Trade: MNQ SHORT on 2026-04-16 14:18:45
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-16 14:18:45+00', 
    '2026-04-16 14:21:26+00', 2, 26340.25, 
    26339.5, -0.20000000000000018, 'CLOSED', '2026-04-16 14:18:45+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 26339.5, 'TP', '2026-04-16 14:21:26+00');

  -- Trade: MNQ SHORT on 2026-04-16 15:34:01
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-16 15:34:01+00', 
    '2026-04-16 15:35:16+00', 2, 26480.75, 
    26497.5, -70.2, 'CLOSED', '2026-04-16 15:34:01+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 26497.5, 'TP', '2026-04-16 15:35:16+00');

  -- Trade: MNQ LONG on 2026-04-16 15:58:08
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-16 15:58:08+00', 
    '2026-04-16 16:02:28+00', 1, 26527, 
    26528, 0.3999999999999999, 'CLOSED', '2026-04-16 15:58:08+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 26528, 'TP', '2026-04-16 16:02:28+00');

  -- Trade: MNQ SHORT on 2026-04-16 16:27:05
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-16 16:27:05+00', 
    '2026-04-16 16:33:44+00', 2, 26539, 
    26452, 344.8, 'CLOSED', '2026-04-16 16:27:05+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 26452, 'TP', '2026-04-16 16:33:44+00');

  -- Trade: MNQ LONG on 2026-04-17 14:35:10
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-17 14:35:10+00', 
    '2026-04-17 14:54:04+00', 2, 26782.5, 
    26837.75, 172.8, 'CLOSED', '2026-04-17 14:35:10+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 26815.25, 'TP', '2026-04-17 14:40:22+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 26837.75, 'TP', '2026-04-17 14:54:04+00');

  -- Trade: MNQ SHORT on 2026-04-20 13:41:21
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-20 13:41:21+00', 
    '2026-04-20 13:42:41+00', 3, 26763.75, 
    26761.75, 7.199999999999999, 'CLOSED', '2026-04-20 13:41:21+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 3, 26761.75, 'TP', '2026-04-20 13:42:41+00');

  -- Trade: MNQ SHORT on 2026-04-20 13:49:32
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-20 13:49:32+00', 
    '2026-04-20 13:52:37+00', 2, 26733.25, 
    26773.5, -164.2, 'CLOSED', '2026-04-20 13:49:32+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 26773.5, 'TP', '2026-04-20 13:52:37+00');

  -- Trade: MNQ SHORT on 2026-04-20 14:49:45
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-20 14:49:45+00', 
    '2026-04-20 14:51:05+00', 3, 26712.5, 
    26661, 304.2, 'CLOSED', '2026-04-20 14:49:45+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 3, 26661, 'TP', '2026-04-20 14:51:05+00');

  -- Trade: MNQ LONG on 2026-04-20 16:21:55
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-20 16:21:55+00', 
    '2026-04-20 16:24:10+00', 2, 26677.75, 
    26679, 1.7999999999999998, 'CLOSED', '2026-04-20 16:21:55+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 26679, 'TP', '2026-04-20 16:24:10+00');

  -- Trade: MNQ SHORT on 2026-04-21 14:30:10
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-21 14:30:10+00', 
    '2026-04-21 14:30:53+00', 3, 26851.25, 
    26849.25, 7.199999999999999, 'CLOSED', '2026-04-21 14:30:10+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 3, 26849.25, 'TP', '2026-04-21 14:30:53+00');

  -- Trade: MNQ LONG on 2026-04-21 15:21:14
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-21 15:21:14+00', 
    '2026-04-21 15:23:30+00', 3, 26772, 
    26755, -106.8, 'CLOSED', '2026-04-21 15:21:14+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 3, 26755, 'TP', '2026-04-21 15:23:30+00');

  -- Trade: MNQ SHORT on 2026-04-21 15:32:54
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-21 15:32:54+00', 
    '2026-04-21 15:47:26+00', 3, 26751.5, 
    26744.5, 37.2, 'CLOSED', '2026-04-21 15:32:54+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 3, 26744.5, 'TP', '2026-04-21 15:47:26+00');

  -- Trade: MNQ SHORT on 2026-04-21 15:55:55
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-21 15:55:55+00', 
    '2026-04-21 16:00:55+00', 2, 26730.75, 
    26757.25, -109.2, 'CLOSED', '2026-04-21 15:55:55+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 26757.25, 'TP', '2026-04-21 16:00:55+00');

  -- Trade: MNQ LONG on 2026-04-22 14:05:06
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-22 14:05:06+00', 
    '2026-04-22 14:30:42+00', 3, 26874.75, 
    26975.25, 457.2, 'CLOSED', '2026-04-22 14:05:06+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 26904.75, 'TP', '2026-04-22 14:07:49+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 26975.25, 'TP', '2026-04-22 14:30:42+00');

  -- Trade: MNQ SHORT on 2026-04-23 14:32:31
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-23 14:32:31+00', 
    '2026-04-23 14:37:52+00', 3, 27051, 
    27048.75, 8.7, 'CLOSED', '2026-04-23 14:32:31+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 3, 27048.75, 'TP', '2026-04-23 14:37:52+00');

  -- Trade: MNQ SHORT on 2026-04-23 14:43:34
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'SHORT', '2026-04-23 14:43:34+00', 
    '2026-04-23 14:47:44+00', 2, 27018.75, 
    27050.25, -129.2, 'CLOSED', '2026-04-23 14:43:34+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 2, 27050.25, 'TP', '2026-04-23 14:47:44+00');

  -- Trade: MNQ LONG on 2026-04-23 14:54:53
  INSERT INTO trades (account_id, user_id, asset, type, entry_date, exit_date, contract_size, entry_price, exit_price, pnl, status, created_at)
  VALUES (
    account_uuid, target_user_id, 'MNQ', 'LONG', '2026-04-23 14:54:53+00', 
    '2026-04-23 15:15:04+00', 2, 27074.75, 
    27118.75, 156.3, 'CLOSED', '2026-04-23 14:54:53+00'
  ) RETURNING id INTO trade_uuid;

  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 27110.5, 'TP', '2026-04-23 15:00:32+00');
  INSERT INTO trade_exits (trade_id, closed_contract, exit_price, exit_status, created_at)
  VALUES (trade_uuid, 1, 27118.75, 'TP', '2026-04-23 15:15:04+00');

  -- Daily PnL updates
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-02-24', 158.4, '2026-02-24 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-02-25', -76.2, '2026-02-25 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-02-26', 229.4, '2026-02-26 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-02-27', -247.29999999999998, '2026-02-27 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-02', -92.1, '2026-03-02 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-03', -240.49999999999997, '2026-03-03 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-04', 153.79999999999998, '2026-03-04 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-05', 66.9, '2026-03-05 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-06', 349.4, '2026-03-06 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-09', 15.9, '2026-03-09 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-10', 173.20000000000002, '2026-03-10 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-11', 0.8999999999999999, '2026-03-11 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-12', 4.4, '2026-03-12 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-13', 56.9, '2026-03-13 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-16', 54.599999999999994, '2026-03-16 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-17', 107.30000000000001, '2026-03-17 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-18', -219.39999999999998, '2026-03-18 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-19', -66.69999999999999, '2026-03-19 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-20', -35.6, '2026-03-20 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-24', -44.699999999999996, '2026-03-24 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-25', 10.8, '2026-03-25 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-03-31', 306.8, '2026-03-31 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-01', -100.9, '2026-04-01 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-02', 294.6, '2026-04-02 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-06', 23.6, '2026-04-06 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-08', 7.199999999999999, '2026-04-08 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-09', 103.50000000000001, '2026-04-09 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-10', 114.5, '2026-04-10 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-13', 167.5, '2026-04-13 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-14', 46.499999999999986, '2026-04-14 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-15', 18.099999999999998, '2026-04-15 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-16', 168.6, '2026-04-16 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-17', 172.8, '2026-04-17 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-20', 149, '2026-04-20 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-21', -171.6, '2026-04-21 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-22', 457.2, '2026-04-22 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;
  INSERT INTO daily_pnl (account_id, user_id, date, pnl, created_at)
  VALUES (account_uuid, target_user_id, '2026-04-23', 35.800000000000026, '2026-04-23 00:00:00+00')
  ON CONFLICT (account_id, date) DO UPDATE SET pnl = daily_pnl.pnl + EXCLUDED.pnl;

  -- Update current balance
  UPDATE accounts SET current_balance = initial_balance + 2152.6000000000004 WHERE id = account_uuid;
END $$;