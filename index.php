<?php declare(strict_types = 1);

class HelloWorld
{
        public function sayHello(DateTimeImutable $date): void
        {
                echo 'Hello, 1' . $date->format('j. n. Y');
        }
}


