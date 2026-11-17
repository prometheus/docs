#!/bin/env python3
#
# This script checks that any change to an OpenMetrics specification file
# also changes its version. The spec must contain a line such as:
#    - Version: 2.0.0-rc0
#
# The spec at <head> is compared against the merge base of <base> and <head>,
# so only the changes introduced by <head> are considered.
#
# Usage: python3 check_openmetrics_spec_version.py <base> <head> <filename.md>
# Example:
#    python3 check_openmetrics_spec_version.py origin/main HEAD docs/specs/om/open_metrics_spec_2_0.md

import re
import subprocess
import sys

version_re = re.compile(r'^- Version:\s*(.*?)\s*$')

def git(*args):
    return subprocess.run(['git', *args], capture_output=True, text=True)

def get_version(revision, filename):
    """
    Returns the version from the spec at the given git revision, or None
    if the file or the version line does not exist there.
    """
    result = git('show', f'{revision}:{filename}')
    if result.returncode != 0:
        return None
    for line in result.stdout.splitlines():
        match = version_re.match(line)
        if match:
            return match.group(1)
    return None

# Main
if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python3 check_openmetrics_spec_version.py <base> <head> <filename.md>")
        sys.exit(1)

    base, head, filename = sys.argv[1:]
    if not filename.endswith('.md'):
        print(f"Error: {filename} is not a Markdown file.")
        sys.exit(1)

    merge_base = git('merge-base', base, head)
    if merge_base.returncode != 0:
        print(f"Error: cannot find merge base of {base} and {head}: {merge_base.stderr.strip()}")
        sys.exit(1)
    merge_base = merge_base.stdout.strip()

    if git('diff', '--quiet', merge_base, head, '--', filename).returncode == 0:
        print(f"No changes to {filename} since {merge_base}, nothing to check.")
        sys.exit(0)

    old_version = get_version(merge_base, filename)
    new_version = get_version(head, filename)

    if not new_version:
        print(f"Error: no '- Version: <version>' line found in {filename}.")
        sys.exit(1)

    if old_version == new_version:
        print(f"Error: {filename} changed but its version is still '{new_version}'.")
        print("Bump the '- Version:' line so that spec changes are versioned.")
        sys.exit(1)

    print(f"Version of {filename} changed from '{old_version or '<none>'}' to '{new_version}'.")
