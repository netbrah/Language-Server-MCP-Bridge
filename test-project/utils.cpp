#include "utils.h"

int add_numbers(int a, int b) {
    return a + b;
}

int multiply_numbers(int a, int b) {
    return a * b;
}

Calculator::Calculator() : lastResult(0.0) {
}

double Calculator::add(double a, double b) {
    lastResult = a + b;
    return lastResult;
}

double Calculator::subtract(double a, double b) {
    lastResult = a - b;
    return lastResult;
}

double Calculator::getLastResult() const {
    return lastResult;
}