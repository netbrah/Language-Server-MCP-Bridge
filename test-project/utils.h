#pragma once

/**
 * Utility functions for testing clangd MCP server capabilities.
 */

/**
 * Adds two integers together.
 * @param a First integer
 * @param b Second integer  
 * @return Sum of a and b
 */
int add_numbers(int a, int b);

/**
 * Multiplies two integers.
 * @param a First integer
 * @param b Second integer
 * @return Product of a and b
 */
int multiply_numbers(int a, int b);

/**
 * A simple class for testing member function completion and hover.
 */
class Calculator {
public:
    /**
     * Constructor
     */
    Calculator();
    
    /**
     * Adds two numbers
     */
    double add(double a, double b);
    
    /**
     * Subtracts two numbers
     */
    double subtract(double a, double b);
    
    /**
     * Gets the last result
     */
    double getLastResult() const;

private:
    double lastResult;
};