#!/bin/env python3
#
# This script opens a markdown file containing the OpenMetrics specification,
# extracts the ABNF grammar from it, and checks if the grammar is valid.
# ABNF grammer must be enclosed in
#    ```abnf
#    exposition = metricset HASH SP eof [ LF ]
#    ...
#    ```
# code block, and the top node must be `exposition`.
# It also extracts examples from the OpenMetrics spec file and checks if they
# are valid according to the grammar.
# Exampes must be enclosed in
#    ```openmetrics
#    ... example content ...
#    ```
# code blocks.

from abnf import Rule
import sys

class Grammar(Rule):
    pass

# Start node for the OpenMetrics spec.
start_node = 'exposition'

def get_spec(filename):
    with open(filename, 'r') as file:
        lines = file.readlines()
    spec = []
    collecting = False
    for line in lines:
        if collecting:
            if line.startswith('```'):
                collecting = False
            else:
                spec.append(line.strip())
            continue
        if line.startswith('```abnf'):
            if len(spec) > 0:
                raise ValueError("Multiple ABNF blocks found in the file.")
            collecting = True

    if len(spec) == 0:
        raise ValueError("No or empty ABNF block found in the file. Wanted ```abnf ... ```.")
    return '\n'.join(spec)


class example:
    def __init__(self, line_number, content):
        self.line_number = line_number
        self.content = content

class examples:
    """
    Extracts examples from the OpenMetrics spec file with generator function.
    """
    def __init__(self, filename):
        self.file = open(filename, 'r')
        self.line_number = 0
    
    def __iter__(self):
        return self

    def __next__(self):
        collecting = False
        append_eof = False
        start_line = self.line_number
        example_lines = []
        for line in self.file:
            self.line_number += 1
            if collecting:
                if line.startswith('```'):
                    collecting = False
                    break
                else:
                    example_lines.append(line)
            elif line.startswith('```openmetrics'):
                start_line = self.line_number
                collecting = True
                if line.startswith('```openmetrics-add-eof'):
                    append_eof = True
        if len(example_lines) > 0:
            if append_eof:
                example_lines.append('# EOF')
            return example(start_line, ''.join(example_lines).strip())

        raise StopIteration("No more examples found.")

# Main
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 check_openmetrics_spec.py <filename.md>")
        sys.exit(1)

    filename = sys.argv[1]
    if not filename.endswith('.md'):
        print(f"Error: {filename} is not a Markdown file.")
        sys.exit(1)
    spec = get_spec(filename)
    try:
        Grammar.load_grammar(grammar=spec, strict=True)
    except Exception as e:
        print(f"Error parsing ABNF: {e}")
        sys.exit(1)
    print("ABNF parsed successfully.")
    for ex in examples(filename):
        try:
            Grammar.get(start_node).parse_all(ex.content)
            print(f"Example parsed successfully: {ex.line_number}: {ex.content[:30]}...")  # Print first 30 chars
        except Exception as e:
            print(f"Error parsing example at line {ex.line_number}: {e}\nExample: {ex.content[:30]}...")
