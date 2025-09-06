#include <iostream>
#include <vector>
#include <string>
#include "utils.h"

/**
 * Main function that demonstrates various C++ features for testing
 * the clangd MCP server capabilities.
 */
int main() {
    // Test basic types and variables
    std::string message = "Hello, MCP Server!";
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    
    // Test function calls and hover information
    std::cout << message << std::endl;
    
    // Test our custom function from utils.h
    int result = add_numbers(10, 20);
    std::cout << "Addition result: " << result << std::endl;
    
    // Test method calls and completion
    numbers.push_back(6);
    numbers.size();
    
    // Test references - multiple uses of 'message'
    if (!message.empty()) {
        std::cout << "Message length: " << message.length() << std::endl;
    }
    
    // Test completion with standard library
    std::string another_message = "Testing completion";
    another_message.substr(0, 7);
    
    return 0;
}