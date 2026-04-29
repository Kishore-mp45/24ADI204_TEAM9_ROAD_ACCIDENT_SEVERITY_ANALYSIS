"""
Stratified sample creator for Railway deployment.
Scans the full dataset to collect all rare severity classes,
then downsamples dominant classes to match.
"""
import pandas as pd
import os

print("Scanning full dataset for stratified sampling...")
print("(This may take 1-2 minutes for the 3GB file)")

# Collect rows by severity class
buckets = {1: [], 2: [], 3: [], 4: []}
TARGET_PER_CLASS = 10000
chunk_size = 200_000
total_scanned = 0

for chunk in pd.read_csv("US_Accidents_March23.csv", chunksize=chunk_size):
    total_scanned += len(chunk)

    for sev in [1, 2, 3, 4]:
        needed = TARGET_PER_CLASS - len(buckets[sev])
        if needed > 0:
            rows = chunk[chunk["Severity"] == sev]
            buckets[sev].append(rows.iloc[:needed])

    filled = sum(1 for v in buckets.values() if len(pd.concat(v) if v else pd.DataFrame()) >= TARGET_PER_CLASS)
    print(f"  Scanned {total_scanned:,} rows | Classes at target: {filled}/4", end="\r")

    # Stop early once we have enough of all classes
    counts = {s: sum(len(b) for b in buckets[s]) for s in buckets}
    if all(counts[s] >= TARGET_PER_CLASS for s in [1, 2, 3, 4]):
        break

print(f"\nDone scanning {total_scanned:,} rows.")

# Build final balanced dataframe
parts = []
for sev in [1, 2, 3, 4]:
    if buckets[sev]:
        df_sev = pd.concat(buckets[sev], ignore_index=True)
        n = min(TARGET_PER_CLASS, len(df_sev))
        sampled = df_sev.sample(n=n, random_state=42)
        parts.append(sampled)
        print(f"  Severity {sev}: {len(df_sev):,} collected -> {n:,} sampled")
    else:
        print(f"  Severity {sev}: 0 rows found!")

df_sample = pd.concat(parts, ignore_index=True)

# Shuffle so classes are interleaved (not grouped)
df_sample = df_sample.sample(frac=1, random_state=42).reset_index(drop=True)

output_path = "US_Accidents_sample.csv"
df_sample.to_csv(output_path, index=False)

size_mb = os.path.getsize(output_path) / 1024 / 1024
print(f"\nSample saved: {output_path}")
print(f"  Total rows : {len(df_sample):,}")
print(f"  File size  : {size_mb:.1f} MB")
print(f"\nFinal severity distribution:")
print(df_sample["Severity"].value_counts().sort_index())
