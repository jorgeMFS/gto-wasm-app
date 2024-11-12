#include <stdio.h>
#include <stdlib.h>

int real_main(int argc, char argv);

int main(int argc, char argv)
{
    // Set stdout and stderr to unbuffered mode
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);

    // Reopen stdin to read from 'input.txt' in the virtual filesystem
    FILE *input = freopen("input.txt", "r", stdin);
    if (!input)
    {
        perror("Failed to open input.txt");
        return 1;
    }

    int result = real_main(argc, argv);

    // Flush stdout and stderr to ensure all output is captured
    fflush(stdout);
    fflush(stderr);

    return result;
}