import os
import shutil

# ==========================================
# SAFETY TOGGLE: Set to False to run actual deletion
DRY_RUN = False
# ==========================================

BACKUP_DIR = "_deleted_backup"

# Define specific files to remove
FILES_TO_DELETE = [
    "compare_faces.py",
    "python/live.py",
    "python/demo.mp4",
    "vision.ipynb",
    "captain_err.txt",
    "captain_log.txt",
    "full_tree.txt",
    "captain_comparison.png",
    "output.mp4",
    "surveillance_output.mp4",
    "captain_surveillance_output.mp4",
    "captain_v4_output.mp4",
    "tracex_surveillance_output.mp4",
    "tracex_v4_output.mp4"
]

# Define specific directories to remove
DIRS_TO_DELETE = [
    "Un-Use_Project",
    "Target_Capture",
    "Target_Hunt_Results",
    "Captain_Hunt_Results",
    "Matched_Person_Results",
    "debug_detected_faces"
]

def get_size(path):
    if os.path.isfile(path):
        return os.path.getsize(path)
    elif os.path.isdir(path):
        total = 0
        for dirpath, _, filenames in os.walk(path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if not os.path.islink(fp):
                    total += os.path.getsize(fp)
        return total
    return 0

def main():
    print("=== TRACE-X PROJECT CLEANUP SCRIPT ===")
    print(f"DRY_RUN mode is currently: {DRY_RUN}")
    print("The following items are marked for deletion:\n")
    
    items_to_delete = []
    
    # Identify items that actually exist
    for f in FILES_TO_DELETE + DIRS_TO_DELETE:
        if os.path.exists(f):
            items_to_delete.append(f)
            print(f" [X] {f}")
            
    # Always find and include __pycache__ folders dynamically
    for dirpath, dirnames, filenames in os.walk("."):
        # Avoid traversing into backup dir or .git or .venv
        if ".git" in dirpath or ".venv" in dirpath or BACKUP_DIR in dirpath:
            continue
        if "__pycache__" in dirnames:
            cache_path = os.path.join(dirpath, "__pycache__")
            if cache_path not in items_to_delete:
                items_to_delete.append(cache_path)
                print(f" [X] {cache_path}")
    
    if not items_to_delete:
        print("\nNothing to clean up! Project is already clean.")
        return

    # Calculate statistics
    total_bytes = sum(get_size(p) for p in items_to_delete)
    total_mb = total_bytes / (1024 * 1024)
    file_count = 0
    
    for item in items_to_delete:
        if os.path.isfile(item):
            file_count += 1
        elif os.path.isdir(item):
            for _, _, files in os.walk(item):
                file_count += len(files)

    print(f"\nTotal: {file_count} files across selected items.")
    print(f"Estimated Space to Free: {total_mb:.2f} MB")
    
    if DRY_RUN:
        print("\n[!] DRY_RUN is True. No files will be deleted or backed up.")
        print("To actually execute this cleanup, change DRY_RUN = False in the script.")
        return
        
    print("\nExecuting backup and cleanup...")
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    for item in items_to_delete:
        if os.path.exists(item):
            # Mirror the folder structure in the backup directory
            dest = os.path.join(BACKUP_DIR, item)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            
            if os.path.isfile(item):
                shutil.copy2(item, dest)
                os.remove(item)
            elif os.path.isdir(item):
                if os.path.exists(dest):
                    shutil.rmtree(dest)
                shutil.copytree(item, dest)
                shutil.rmtree(item)

    print(f"\nSUCCESS: Deleted {file_count} files | Freed: {total_mb:.2f} MB | Backup saved to: {BACKUP_DIR}/")

if __name__ == '__main__':
    main()
