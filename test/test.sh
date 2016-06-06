#!/bin/bash

failed=0

test() {
  base_dir="$(cd "$(dirname $0)" ; pwd )"
  if [ -f "${base_dir}/../out" ] ; then
    cmd="../out"
  elif [ -f /opt/resource/out ] ; then
    cmd="/opt/resource/out"
  fi

  test=$(cat ${base_dir}/${1})

  expected=$(echo ${test} | jq -r '.expected')

  input=$(echo ${test} | jq -r '.input')
  actual=$(echo ${input} | ${cmd} . 2>&1)
  pass=$?

  diff=$(diff <(echo ${expected} | jq -S . ) <(echo ${actual} | jq -S .))
  pass=$((${pass} + $?))

  echo ""
  echo "------------------------------------------------------------------------------"
  echo "TESTING: $1"

  if [ ${pass} == 0 ]
  then
    echo "PASSED!"
  else
    failed=$((${failed} + 1))
    echo ""
    echo "Input:"
    echo ${input} | jq .
    echo ""
    echo "Expected:"
    echo ${expected} | jq .
    echo ""
    echo "Output:"
    echo ${actual} | jq . || (echo "" && echo ${actual})
    echo ""
    echo "Diff:"
    echo ${diff}
    echo ""
    echo "FAILED!"
  fi
}

export BUILD_PIPELINE_NAME='my-pipeline'
export BUILD_JOB_NAME='my-job'
export BUILD_NAME='my-build'

export DEBUG="true"

# Run against the test case files
for test_case in test_cases/*.json; do test $test_case; done

echo "------------------------------------------------------------------------------"
echo ""
if [ ${failed} == 0 ]
then
    echo -e "All tests passed! :D"
else
    echo -e "There were ${failed} failures :("
fi
