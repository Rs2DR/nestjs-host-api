BEGIN;

CREATE TEMP TABLE inserted_servers (
    id UUID, 
    slug TEXT
) ON COMMIT DROP;

WITH upserted AS (
    INSERT INTO servers (
        slug, name, description, location_name, latitude, longitude, 
        cpu_model, cpu_cores, ram_gb, storage_gb, storage_type, 
        bandwidth_mbps, hourly_rate, currency, is_active, updated_at
    ) VALUES 
    (
        'ams-edge-01', 'Amsterdam Edge 01', 'Low-latency compute server in Amsterdam.', 
        'Amsterdam, Netherlands', 52.3676, 4.9041, 'AMD EPYC 9354P', 16, 128, 2000, 
        'NVMe SSD', 10000, 250, 'eur', TRUE, NOW()
    ),
    (
        'fra-edge-01', 'Frankfurt Edge 01', 'General purpose compute server in Frankfurt.', 
        'Frankfurt, Germany', 50.1109, 8.6821, 'AMD EPYC 9354P', 32, 256, 4000, 
        'NVMe SSD', 25000, 400, 'eur', TRUE, NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        location_name = EXCLUDED.location_name,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        cpu_model = EXCLUDED.cpu_model,
        cpu_cores = EXCLUDED.cpu_cores,
        ram_gb = EXCLUDED.ram_gb,
        storage_gb = EXCLUDED.storage_gb,
        storage_type = EXCLUDED.storage_type,
        bandwidth_mbps = EXCLUDED.bandwidth_mbps,
        hourly_rate = EXCLUDED.hourly_rate,
        currency = EXCLUDED.currency,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING id, slug
)
INSERT INTO inserted_servers SELECT id, slug FROM upserted;


INSERT INTO server_slots (server_id, slot_number, label)
SELECT 
    ins.id AS server_id,
    slot.num AS slot_number,
    'Slot ' || slot.num AS label
FROM inserted_servers ins
CROSS JOIN generate_series(1, 8) AS slot(num)
ON CONFLICT (server_id, slot_number) DO NOTHING;

COMMIT;
