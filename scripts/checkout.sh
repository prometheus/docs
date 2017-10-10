#!/bin/bash

usage() {
me=$(basename $0)
cat <<EOF
Usage:
  $me [ options ] <repository> [ <refspec> ]

Options:
  -d <directory>  Remote directory name of the sparse-checlout. Default: docs/
  -t <path>       Target path of the checkout. Default: repository basename
EOF

exit 1
}

while getopts 'd:t:' OPT
do
  case ${OPT} in
    d)
      DIRECTORY="${OPTARG}"
      ;;
    t)
      TARGET="${OPTARG}"
      ;;
    *)
      usage
      ;;
  esac
done

shift $((OPTIND-1))

[ $# -ge 1 ] || usage

REPOSITORY="$1"
REFSPEC="$2"

if [[ -z "${DIRECTORY}" ]]; then
    DIRECTORY="docs/"
fi

if [[ -z "${TARGET}" ]]; then
    TARGET=$(basename "${REPOSITORY}")
fi

mkdir -p "${TARGET}"
cd "${TARGET}"

git init

git config core.sparsecheckout true
echo "${DIRECTORY}" > .git/info/sparse-checkout

git pull --depth=1 "${REPOSITORY}" "${REFSPEC}"
